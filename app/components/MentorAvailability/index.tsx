'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Calendar,
    Button,
    Typography,
    Select,
    message,
    Radio,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import styles from './mentorAvailability.module.css';
import { supabase } from '../../services/supabase';
import { netToGross } from '../../services/priceHelper';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import { SoundFilled } from '@ant-design/icons';
import { useRef } from 'react';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const { Text, Title } = Typography;

interface TimeSlot { slot_time: string; }
interface AvailabilityResponse {
    code: number;
    message: string;
    data: TimeSlot[];
}
interface Service { type: string; price: number; }

interface MentorAvailabilityProps {
    mentorId: string | number;
    services: Service[];
    onSlotSelect: (slot: { date: string; time: string }) => void;
    onBook: () => void;
    coffeeChatCount: number;
    selectedServiceType?: string | null;
}

interface SlotLabel {
    raw: string;        // 例: "9:00 AM - 10:00 AM"
    formatted: string;  // 例: "9-10 AM"
}

// —— 时间段格式化工具 ——
// 去掉 :00，只显示小时，如果 AM/PM 相同只写一次
function formatSlot(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const startHour = start.format('h');
    const endHour = end.format('h');

    const startPeriod = start.format('A');
    const endPeriod = end.format('A');

    if (startPeriod === endPeriod) {
        return `${startHour}-${endHour} ${startPeriod}`;
    } else {
        return `${startHour} ${startPeriod} - ${endHour} ${endPeriod}`;
    }
}

export default function MentorAvailability({
                                               mentorId,
                                               services,
                                               onSlotSelect,
                                               onBook,
                                               coffeeChatCount,
                                               selectedServiceType,
                                           }: MentorAvailabilityProps) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availabilityData, setAvailabilityData] = useState<Map<string, SlotLabel[]>>(new Map());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [heldSlots, setHeldSlots] = useState<Set<string>>(new Set());
    const [userTimezone, setUserTimezone] = useState('');

    const isFreeSelected =
        !!selectedServiceType && /free coffee chat/i.test(selectedServiceType);

    // ✅ 只有 mentor 提供 Free Coffee Chat 且用户未使用时才显示 Banner (对所有用户显示)
    const hasFreeCoffee = Array.isArray(services) &&
        services.some((s) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type));
    const showFreeBanner = hasFreeCoffee && coffeeChatCount === 0;

    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz);
    }, []);

    useEffect(() => {
        const fetchAvailability = async () => {
            const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
            const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

            try {
                const response = await fetch(
                    `/api/availability/${mentorId}/view?start_date=${startDate}&end_date=${endDate}`
                );
                const data: AvailabilityResponse = await response.json();

                // 读取 hold
                const { data: holdData, error: holdError } = await supabase
                    .from('temp_holds')
                    .select('time_slot')
                    .eq('mentor_id', mentorId)
                    .is('expires_at', null);

                const held = new Set<string>();
                if (!holdError && holdData) {
                    for (const item of holdData) {
                        const clean = item.time_slot.replace(/[\[\]()"]/g, '').split(',');
                        const start = dayjs(clean[0]);
                        const end = dayjs(clean[1]);
                        const dateKey = start.format('YYYY-MM-DD');
                        const slotLabel = `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
                        held.add(`${dateKey}|${slotLabel}`);
                    }
                }
                setHeldSlots(held);

                if (data.code === 0) {
                    const availabilityMap = new Map<string, SlotLabel[]>();
                    const nowPlus24h = dayjs().add(24, 'hour');

                    data.data.forEach(({ slot_time }) => {
                        try {
                            let start: string, end: string;
                            if (slot_time.startsWith('[')) {
                                const cleanSlotTime = slot_time.replace(/[\[\]"]/g, '');
                                [start, end] = cleanSlotTime.split(',');
                                end = end.replace(')', '');
                            } else {
                                const parsed = JSON.parse(slot_time);
                                [start, end] = parsed;
                            }

                            let startTime = dayjs(start);
                            const endTime = dayjs(end);
                            if (!startTime.isValid() || !endTime.isValid()) return;

                            // 跳过 24 小时内的
                            if (startTime.isBefore(nowPlus24h)) return;

                            while (startTime.add(1, 'hour').isSameOrBefore(endTime)) {
                                const nextHour = startTime.add(1, 'hour');
                                const dateKey = startTime.format('YYYY-MM-DD');

                                // 桌面端/业务计算用（原始）
                                const raw = `${startTime.format('h:mm A')} - ${nextHour.format('h:mm A')}`;
                                // 展示用（精简）
                                const formatted = formatSlot(startTime, nextHour);

                                if (!availabilityMap.has(dateKey)) availabilityMap.set(dateKey, []);
                                availabilityMap.get(dateKey)!.push({ raw, formatted });

                                startTime = nextHour;
                            }
                        } catch (error) {
                            console.error('Error processing slot_time:', slot_time, error);
                        }
                    });

                    setAvailabilityData(availabilityMap);
                } else {
                    console.error('API Error:', data.message);
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
            }
        };

        fetchAvailability();
    }, [currentMonth, mentorId]);

    // —— 桌面端：Calendar 相关 ——
    const dateCellRender = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        return availabilityData.has(dateStr) ? <div className={styles.availabilityDot} /> : null;
    };


    // 1) 用 full cell render 灰掉不可用日期（不显示小蓝点）
    const dateFullCellRender = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        const hasSlots = availabilityData.has(dateStr);
        const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;

        const classNames = [
            styles.dateCell,
            !hasSlots ? styles.dateDisabled : '',
            isSelected ? styles.dateSelected : '',   // 👈 选中态
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                className={classNames}
                onClick={(e) => {
                    if (!hasSlots) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                role="button"
                aria-disabled={!hasSlots}
            >
                <span className={styles.dateNum}>{date.date()}</span>
            </div>
        );
    };

    const handleDateSelect = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        if (!availabilityData.has(dateStr)) {
            return;
        }
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handlePanelChange = (date: Dayjs) => {
        setCurrentMonth(date);
        setSelectedDate(null);
        setSelectedSlot(null);
    };

    const headerRender = ({ value }: { value: Dayjs }) => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return (
            <div className={styles.calendarHeaderWrapper}>
                <div className={styles.timezoneText}>
                    <span role="img" aria-label="globe">🌐</span>{' '}
                    <strong>(GMT{dayjs().format('Z')}) {userTimezone}</strong>
                </div>
                <div className={styles.calendarHeader}>
                    <Button onClick={() => handlePanelChange(value.subtract(1, 'month'))} className={styles.navButton}>
                        {'<'}
                    </Button>
                    <span className={styles.monthText}>{months[value.month()]}</span>
                    <Button onClick={() => handlePanelChange(value.add(1, 'month'))} className={styles.navButton}>
                        {'>'}
                    </Button>
                    <Select
                        size="small"
                        value={value.year()}
                        options={Array.from({ length: 10 }, (_, i) => ({
                            label: value.year() - 5 + i,
                            value: value.year() - 5 + i,
                        }))}
                        onChange={(newYear) => handlePanelChange(value.year(newYear))}
                        className={styles.yearSelect}
                    />
                </div>
            </div>
        );
    };

    const isSlotDisabled = (dateISO: string, slotLabel: string) => {
        const [startStr] = slotLabel.split(' - ');
        const start = dayjs(`${dateISO} ${startStr}`);
        const key = `${dateISO}|${slotLabel}`;
        return start.isBefore(dayjs().add(24, 'hour')) || heldSlots.has(key);
    };

    function pickFirstAvailable() {
        if (!availabilityData || availabilityData.size === 0) return false;

        // 日期升序
        const dates = Array.from(availabilityData.keys()).sort();

        for (const dateKey of dates) {
            // 当天时段按开始时间升序
            const slots = [...(availabilityData.get(dateKey) ?? [])].sort((a, b) => {
                const sa = a.raw.split(' - ')[0];
                const sb = b.raw.split(' - ')[0];
                return dayjs(`${dateKey} ${sa}`).valueOf() - dayjs(`${dateKey} ${sb}`).valueOf();
            });

            for (const slot of slots) {
                const slotLabel = slot.raw; // "9:00 AM - 10:00 AM"
                if (isSlotDisabled(dateKey, slotLabel)) continue;

                // 选中日期
                setSelectedDate(dayjs(dateKey, 'YYYY-MM-DD'));

                // 如果是 Free Coffee Chat，把 1h 切成前 15 分钟
                if (isFreeSelected) {
                    const [startStr] = slotLabel.split(' - ');
                    const start = dayjs(`${dateKey} ${startStr}`);
                    const end15 = start.add(15, 'minute');
                    const raw15 = `${start.format('h:mm A')} - ${end15.format('h:mm A')}`;
                    setSelectedSlot(raw15);
                } else {
                    setSelectedSlot(slotLabel);
                }
                return true;
            }
        }
        return false;
    }
    const prevServiceRef = useRef<string | null>(null);

    useEffect(() => {
        const serviceChanged = prevServiceRef.current !== selectedServiceType;

        // 没有服务类型或没有可用数据，记录后返回
        if (!selectedServiceType || !availabilityData || availabilityData.size === 0) {
            prevServiceRef.current = selectedServiceType ?? null;
            return;
        }

        if (serviceChanged) {
            // 服务切换：强制重选最近可预约的日期+时间（含 Free 15min 逻辑）
            pickFirstAvailable();
            prevServiceRef.current = selectedServiceType;
            return;
        }

        // 服务没变：保持“用户未手动选择才自动选”的策略
        if (!selectedDate && !selectedSlot) {
            pickFirstAvailable();
        }

        prevServiceRef.current = selectedServiceType;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServiceType, availabilityData, heldSlots]);

    const getPriceText = () => {
        const firstPaidService =
            services.find(
                (s) =>
                    s &&
                    typeof s.type === 'string' &&
                    !/free coffee chat/i.test(s.type) &&
                    (s.price ?? 0) > 0
            );
        return firstPaidService ? `$${netToGross(firstPaidService.price)}` : 'Free';
    };

    // —— 仅桌面端 UI ——
    return (
        <Card className={styles.availabilityCard}>
            <Calendar
                fullscreen={false}
                onSelect={handleDateSelect}
                onPanelChange={handlePanelChange}
                dateFullCellRender={dateFullCellRender}
                headerRender={headerRender}
                value={selectedDate || currentMonth}
                className={styles.calendar}
            />

            {selectedDate && (
                <div className={styles.timeSlots}>
                    <Text strong className={styles.timeSlotsTitle}>
                        Available Time Slots on {selectedDate.format('MMMM D, YYYY')}
                    </Text>

                    {/* ✅ 仅当 mentor 有 Free Coffee 且用户未用过时显示 */}
                    {showFreeBanner && (
                        <div className={styles.trialBubble} role="note" aria-live="polite">
        <span className={styles.bubbleIcon}>
        <SoundFilled />
        </span>
                            <span className={styles.bubbleText}>Get a trial session for FREE!</span>
                        </div>
                    )}


                    {availabilityData.has(selectedDate.format('YYYY-MM-DD')) ? (
                        <>
                            <div className={styles.slotsScroll}>
                                <Radio.Group
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                    className={styles.radioGroup}
                                >
                                    {availabilityData.get(selectedDate.format('YYYY-MM-DD'))!.map((slot, i) => {
                                        const [startStr /* , endStr */] = slot.raw.split(' - ');
                                        const start = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);

                                        // —— 如果选中的是 Free Coffee Chat：把小时段改为前 15 分钟 —— //
                                        const freeEnd = start.add(15, 'minute');
                                        const raw15 = `${start.format('h:mm A')} - ${freeEnd.format('h:mm A')}`; // 传给父组件用
                                        const label15 = `${start.format('h:mm')}-${freeEnd.format('h:mm A')}`;   // 展示用：7:00-7:15 PM

                                        // 禁用逻辑：24h 内或被 hold
                                        const slotKey = `${selectedDate.format('YYYY-MM-DD')}|${slot.raw}`; // hold 针对原小时段
                                        const disabled =
                                            start.isBefore(dayjs().add(24, 'hour')) || heldSlots.has(slotKey);

                                        // 展示用文本 & 价格/时长
                                        const slotText = isFreeSelected ? label15 : (slot.formatted ?? slot.raw);
                                        const durationText = isFreeSelected ? '(15mins)' : '(1h)';

                                        // 付费价格：如果是 Free，显示 Free；否则沿用你的逻辑
                                        let price = 'Free';
                                        if (!isFreeSelected) {
                                            const firstPaidService = services.find(
                                                (s) =>
                                                    s &&
                                                    typeof s.type === 'string' &&
                                                    !/free coffee chat/i.test(s.type) &&
                                                    (s.price ?? 0) > 0
                                            );

                                            price = firstPaidService ? `$${netToGross(firstPaidService.price)}` : 'Free';
                                        }
                                        const radioValue = isFreeSelected ? raw15 : slot.raw;
                                        return (
                                            <Radio
                                                key={i}
                                                value={radioValue}
                                                disabled={disabled}
                                                className={[
                                                    styles.timeSlotRadio,
                                                    disabled ? styles.timeSlotRadioDisabled : ''
                                                ].join(' ')}
                                            >
                                                <div className={styles.radioContent}>
                                                    <span className={styles.slotText}>{slotText}</span>
                                                    <span className={styles.slotDetails}>
          {durationText}
        </span>
                                                </div>
                                            </Radio>
                                        );
                                    })}
                                </Radio.Group>

                                <Button
                                    type="primary"
                                    block
                                    disabled={!selectedSlot}
                                    className={styles.scheduleButton}
                                    style={{ marginTop: 20 }}
                                    onClick={() => {
                                        if (selectedDate && selectedSlot) {
                                            const [startStr] = selectedSlot.split(' - ');
                                            const slotDateTime = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);
                                            if (slotDateTime.isBefore(dayjs().add(24, 'hour'))) {
                                                message.error('Cannot book less than 24 hours in advance.');
                                                return;
                                            }
                                            onSlotSelect({
                                                date: selectedDate.format('YYYY-MM-DD'),
                                                time: selectedSlot,
                                            });
                                            onBook();
                                        }
                                    }}
                                >
                                    Book Now
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Text className={styles.noSlotsText}>No available time slots.</Text>
                    )}
                </div>
            )}
        </Card>
    );
}
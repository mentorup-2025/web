'use client';

import { useState, useEffect, useRef } from 'react';
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
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import { SoundFilled } from '@ant-design/icons';
import styles from './mentorAvailability.module.css';
import { supabase } from '../../services/supabase';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const { Text } = Typography;

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
    /** 律师传 30，其它不传或传 60 */
    forcedDurationMinutes?: number;
}

interface SlotLabel {
    raw: string;        // e.g. "1:00 PM - 1:30 PM"
    formatted: string;  // e.g. "1:00-1:30 PM"
}

/** 显示为 “1:00-1:30 PM”；若跨 AM/PM 则两边都带 */
function formatSlot(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const samePeriod = start.format('A') === end.format('A');
    if (samePeriod) return `${start.format('h:mm')}-${end.format('h:mm A')}`;
    return `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
}

export default function MentorAvailability({
                                               mentorId,
                                               services,
                                               onSlotSelect,
                                               onBook,
                                               coffeeChatCount,
                                               selectedServiceType,
                                               forcedDurationMinutes,
                                           }: MentorAvailabilityProps) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availabilityData, setAvailabilityData] = useState<Map<string, SlotLabel[]>>(new Map());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [heldSlots, setHeldSlots] = useState<Set<string>>(new Set());
    const [userTimezone, setUserTimezone] = useState('');
    const [userHasPickedSlot, setUserHasPickedSlot] = useState(false);
    // 仅用于 banner 提示（不影响时长）
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

                    // —— 根据选择的服务动态确定切片时长 —— //
                    const isFreeSelected =
                        !!selectedServiceType && /free coffee chat/i.test(selectedServiceType);

                    // 若传入 forcedDurationMinutes（律师=30）则优先使用；否则 Free=15，默认=60
                    const slotMinutes =
                        typeof forcedDurationMinutes === 'number' && forcedDurationMinutes > 0
                            ? forcedDurationMinutes
                            : (isFreeSelected ? 15 : 60);

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

                            // 跳过 24 小时内
                            if (startTime.isBefore(nowPlus24h)) return;

                            while (startTime.add(slotMinutes, 'minute').isSameOrBefore(endTime)) {
                                const nextTime = startTime.add(slotMinutes, 'minute');

                                // ★ 对于 15 或 30 分钟段，只保留“整点开始”的切片（起始分钟 = 0）
                                if ((slotMinutes === 15 || slotMinutes === 30) && startTime.minute() !== 0) {
                                    startTime = nextTime;
                                    continue;
                                }

                                const dateKey = startTime.format('YYYY-MM-DD');
                                const raw = `${startTime.format('h:mm A')} - ${nextTime.format('h:mm A')}`;
                                const formatted = formatSlot(startTime, nextTime);

                                if (!availabilityMap.has(dateKey)) availabilityMap.set(dateKey, []);
                                availabilityMap.get(dateKey)!.push({ raw, formatted });

                                startTime = nextTime;
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
    }, [currentMonth, mentorId, forcedDurationMinutes, selectedServiceType]); // ← 关键：根据服务切换重切片


    function tryPreserveSelection(): boolean {
        if (!selectedDate) return false;

        const dateKey = selectedDate.format('YYYY-MM-DD');
        const slots = availabilityData.get(dateKey);
        if (!slots || slots.length === 0) return false;

        // 1) 如果原选的 slot 仍然存在且不禁用，直接保留
        if (selectedSlot) {
            const stillExists = slots.some(s => s.raw === selectedSlot && !isSlotDisabled(dateKey, s.raw));
            if (stillExists) return true;
        }

        // 2) 否则在同一天找“>=原开始时间”的最近 slot；没有就同天第一可用；同天也没有则返回 false
        const candidates = slots
            .filter(s => !isSlotDisabled(dateKey, s.raw))
            .sort((a, b) => {
                const sa = dayjs(`${dateKey} ${a.raw.split(' - ')[0]}`).valueOf();
                const sb = dayjs(`${dateKey} ${b.raw.split(' - ')[0]}`).valueOf();
                return sa - sb;
            });

        if (candidates.length === 0) return false;

        if (selectedSlot) {
            const [origStart] = selectedSlot.split(' - ');
            const origTs = dayjs(`${dateKey} ${origStart}`).valueOf();
            const found = candidates.find(s => {
                const ts = dayjs(`${dateKey} ${s.raw.split(' - ')[0]}`).valueOf();
                return ts >= origTs;
            }) || candidates[0];

            setSelectedSlot(found.raw);
            return true;
        }

        // 之前没选具体 slot，则用同天第一可用
        setSelectedSlot(candidates[0].raw);
        return true;
    }

    // —— Calendar：禁用无可用日期 + 选中态 —— //
    const dateFullCellRender = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        const hasSlots = availabilityData.has(dateStr);
        const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;

        const classNames = [
            styles.dateCell,
            !hasSlots ? styles.dateDisabled : '',
            isSelected ? styles.dateSelected : '',
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
        if (!availabilityData.has(dateStr)) return;

        setSelectedDate(date);
        setSelectedSlot(null);
        setUserHasPickedSlot(true); // ✅ 用户手动改过
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

        const dates = Array.from(availabilityData.keys()).sort();
        for (const dateKey of dates) {
            const slots = [...(availabilityData.get(dateKey) ?? [])].sort((a, b) => {
                const sa = a.raw.split(' - ')[0];
                const sb = b.raw.split(' - ')[0];
                return dayjs(`${dateKey} ${sa}`).valueOf() - dayjs(`${dateKey} ${sb}`).valueOf();
            });

            for (const slot of slots) {
                const slotLabel = slot.raw;
                if (isSlotDisabled(dateKey, slotLabel)) continue;

                setSelectedDate(dayjs(dateKey, 'YYYY-MM-DD'));
                setSelectedSlot(slotLabel);
                return true;
            }
        }
        return false;
    }

    const prevServiceRef = useRef<string | null>(null);
    useEffect(() => {
        const serviceChanged = prevServiceRef.current !== selectedServiceType;

        // 没有服务或没有数据时直接记录并返回
        if (!selectedServiceType || !availabilityData || availabilityData.size === 0) {
            prevServiceRef.current = selectedServiceType ?? null;
            return;
        }

        // 服务变了
        if (serviceChanged) {
            // 用户手动改过：尽量保留原选择（先同日、再全局兜底）
            if (userHasPickedSlot) {
                const preserved = tryPreserveSelection();
                if (!preserved) {
                    // 原日找不到可用 → 全局最近
                    pickFirstAvailable();
                }
            } else {
                // 用户没改过（第一次点服务）：直接选全局最近日期+时段
                pickFirstAvailable();
            }

            prevServiceRef.current = selectedServiceType;
            return;
        }

        // 非服务变更，但当前还没选任何日期/时段（如首次加载完数据）
        if (!selectedDate || !selectedSlot) {
            pickFirstAvailable();
        }

        prevServiceRef.current = selectedServiceType;
    }, [selectedServiceType, availabilityData, heldSlots]); // 依赖保持不变
    useEffect(() => {
        // 没有日期或没数据，不需要校验
        if (!selectedDate || availabilityData.size === 0) return;

        const dateKey = selectedDate.format('YYYY-MM-DD');
        const slots = availabilityData.get(dateKey) || [];

        // 该日期下是否还包含当前选中的 slot，并且未被禁用
        const stillValid =
            !!selectedSlot &&
            slots.some(s => s.raw === selectedSlot && !isSlotDisabled(dateKey, s.raw));

        if (stillValid) return;

        // 走“保留同日/就近”的规则，失败再全局兜底
        const preserved = tryPreserveSelection();
        if (!preserved) {
            const picked = pickFirstAvailable();
            if (!picked) {
                // 全局也没有可选的，清空选中状态（避免 value 指向不存在的项）
                setSelectedSlot(null);
            }
        }

        // 注意：这是自动修复，不应标记为“用户手动选择”
        // 所以不要 setUserHasPickedSlot(true)
    }, [availabilityData, heldSlots, selectedDate, selectedSlot]);
    // —— 仅桌面端 UI —— //
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

                    {showFreeBanner && (
                        <div className={styles.trialBubble} role="note" aria-live="polite">
                            <span className={styles.bubbleIcon}><SoundFilled /></span>
                            <span className={styles.bubbleText}>Get a trial session for FREE!</span>
                        </div>
                    )}

                    {availabilityData.has(selectedDate.format('YYYY-MM-DD')) ? (
                        <>
                            <div className={styles.slotsScroll}>
                                <Radio.Group
                                    value={selectedSlot}
                                    onChange={(e) => {
                                        setSelectedSlot(e.target.value);
                                        setUserHasPickedSlot(true); // ✅ 用户手动改过
                                    }}
                                    className={styles.radioGroup}
                                >
                                    {availabilityData.get(selectedDate.format('YYYY-MM-DD'))!.map((slot, i) => {
                                        const [startStr] = slot.raw.split(' - ');
                                        const start = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);

                                        // 禁用逻辑
                                        const slotKey = `${selectedDate.format('YYYY-MM-DD')}|${slot.raw}`;
                                        const disabled =
                                            start.isBefore(dayjs().add(24, 'hour')) || heldSlots.has(slotKey);

                                        // 展示：时长基于 forcedDurationMinutes / Free=15 / 默认60
                                        const isFreeSelected =
                                            !!selectedServiceType && /free coffee chat/i.test(selectedServiceType);
                                        const minutes =
                                            typeof forcedDurationMinutes === 'number' && forcedDurationMinutes > 0
                                                ? forcedDurationMinutes
                                                : (isFreeSelected ? 15 : 60);

                                        return (
                                            <Radio
                                                key={i}
                                                value={slot.raw}
                                                disabled={disabled}
                                                className={[
                                                    styles.timeSlotRadio,
                                                    disabled ? styles.timeSlotRadioDisabled : ''
                                                ].join(' ')}
                                            >
                                                <div className={styles.radioContent}>
                                                    <span className={styles.slotText}>{slot.formatted ?? slot.raw}</span>
                                                    <span className={styles.slotDetails}>
                            ({minutes}mins)
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
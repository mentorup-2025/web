'use client';

import React, { Fragment } from 'react';
import { useEffect, useState, useCallback } from 'react';
import styles from './AvailabilityTab.module.css';
import {
    Typography,
    Card,
    Row,
    Col,
    Button,
    TimePicker,
    Tag,
    Space,
    DatePicker,
    message,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
const { Title } = Typography;
// 我们分别给两个 RangePicker 起别名，避免名字冲突：
const TimeRangePicker = TimePicker.RangePicker;
const DateRangePicker = DatePicker.RangePicker;

const timeFormat = 'HH:mm';

interface Slot {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

interface BlockItem {
    id: string;
    blocked_range: string; // 格式 "YYYY-MM-DD"
}

interface Props {
    userId: string;
}

const slotKey = (s: Slot) => `${s.day_of_week}-${s.start_time}-${s.end_time}`;


export default function AvailabilityTab({ userId }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [originalSlots, setOriginalSlots] = useState<Slot[]>([]);
    const [blocks, setBlocks] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});

    const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    const [tzAbbr, setTzAbbr] = useState<string>('');

    // 取得时区缩写（如 "PDT"、"CST" 等）
    useEffect(() => {
        const parts = new Date()
            .toLocaleTimeString('en-US', { timeZoneName: 'short' })
            .split(' ');
        setTzAbbr(parts[parts.length - 1]);
    }, []);

    // 拉取已屏蔽日期列表
    const fetchBlocks = useCallback(async () => {
        try {
            const res = await fetch(`/api/availability_block/${userId}`);
            const json = await res.json();
            setBlocks(json.data || []);
        } catch (err) {
            message.error('Failed to load blocked dates.');
        }
    }, [userId]);

    // ———————— 1. 获取「Weekly Available Hours」 ————————
    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        Promise.all([
            // ← 这里调用新的 GET 接口
            fetch(`/api/availability/${userId}/get`).then(r => r.json()),
            fetchBlocks(),
        ])
            .then(([availRes]) => {
                const fetchedSlots: Slot[] = (availRes.data || []).map((item: any) => ({
                    day_of_week: item.weekday as number,
                    start_time:  dayjs.utc(item.start_time, 'HH:mm:ss').local().format(timeFormat),
                    end_time:    dayjs.utc(item.end_time,   'HH:mm:ss').local().format(timeFormat),
                }));
                setSlots(fetchedSlots);
                setOriginalSlots(fetchedSlots);
            })
            .catch(() => {
                message.error('Failed to load availability.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId, fetchBlocks]);

    // 保存「Weekly Available Hours」
    const handleSaveSlots = async (slotsToSave: Slot[] = slots) => {
        setLoading(true);
        if (Object.keys(slotErrors).length > 0) {
            message.error('Please fix all errors before saving');
            setLoading(false);
            return;
        }
        // 1. Ensure each slot is at least 1 hour long
        const tooShort = slotsToSave.some(s => {
            const start = dayjs(s.start_time, timeFormat);
            const end   = dayjs(s.end_time,   timeFormat);
            // diff in hours (floating point); require ≥1
            return end.diff(start, 'hour', true) < 1;
        });
        if (tooShort) {
            message.error('Each time slot must be at least 1 hour long');
            setLoading(false);
            return;
        }

// 2. Slots on the same day must not overlap
        const groups = slotsToSave.reduce<Record<number, Slot[]>>((acc, s) => {
            (acc[s.day_of_week] ||= []).push(s);
            return acc;
        }, {});
        for (const [day, list] of Object.entries(groups)) {
            // sort by start time
            const sorted = list
                .map(s => ({ ...s }))
                .sort((a, b) =>
                    dayjs(a.start_time, timeFormat).isBefore(dayjs(b.start_time, timeFormat))
                        ? -1
                        : 1
                );
            // check pairwise
            for (let i = 1; i < sorted.length; i++) {
                const prevEnd   = dayjs(sorted[i - 1].end_time,   timeFormat);
                const currStart = dayjs(sorted[i    ].start_time, timeFormat);
                if (currStart.isBefore(prevEnd)) {
                    message.error(
                        `On ${dayNames[Number(day)]}, slots ` +
                        `${sorted[i - 1].start_time}-${sorted[i - 1].end_time} ` +
                        `and ${sorted[i].start_time}-${sorted[i].end_time} overlap`
                    );
                    setLoading(false);
                    return;
                }
            }
        }
        // client-side 验证：保证 start < end
        const isValidSlots = slotsToSave.every(slot => {
            const start = dayjs(slot.start_time, timeFormat);
            const end = dayjs(slot.end_time, timeFormat);
            return start.isValid() && end.isValid() && end.isAfter(start);
        });
        if (!isValidSlots) {
            message.error('Invalid time slots – please check your start and end times');
            setLoading(false);
            return;
        }

// 在 handleSaveSlots(...) 内
        try {
            // 构造请求体，注意后端期望字段名是 weekday
            const payload = {
                user_id: userId,
                availabilities: slotsToSave.map(s => ({
                    day_of_week: s.day_of_week,
                    start_time: dayjs(s.start_time, 'HH:mm')       // 本地 HH:mm → UTC HH:mm:ss
                        .utc()
                        .format('HH:mm'),
                    end_time:   dayjs(s.end_time,   'HH:mm')
                        .utc()
                        .format('HH:mm'),

                })),
            };
            console.log('→ saving availability payload:', JSON.stringify(payload, null, 2));
            const res = await fetch('/api/availability/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                // 先拿文本（有可能后端直接传了一段错误字符串），再报错
                const errText = await res.text().catch(() => '');
                throw new Error(errText || `HTTP ${res.status}`);
            }

            // 后端只返回 200 OK，无 body，无需再做 res.json()
            message.success('Weekly availability updated successfully.');
            // （可选）如果你想再重新拉一次最新数据：
            // const refreshed = await fetch(`/api/availability/${userId}/get`).then(r => r.json());
            // 同步刷新 UI
        //     const byDay: Record<number, Slot> = {};
        //     (refreshed.data || []).forEach((item: any) => {
        //       const dow = item.weekday;
        //         const hhmmStart = dayjs.utc(item.start_time, 'HH:mm').local().format(timeFormat);
        //         const hhmmEnd   = dayjs.utc(item.end_time,   'HH:mm').local().format(timeFormat);
        //       if (!byDay[dow]) {
        //         byDay[dow] = {
        //           day_of_week: dow,
        //           start_time: hhmmStart,
        //           end_time: hhmmEnd,
        //         };
        //       }
        //     });
        //     setSlots(Object.values(byDay));
        } catch (err: any) {
            message.error('Failed to update availability:' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 修改某一天的时间段（调用 handleSaveSlots）
    const updateSlot = (i: number, changes: Partial<Slot>) => {
        const next = [...slots];
        next[i] = { ...next[i], ...changes };

        // 验证 start < end
        if (changes.start_time || changes.end_time) {
            const start = dayjs(next[i].start_time, timeFormat);
            const end = dayjs(next[i].end_time, timeFormat);
            if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
                message.error('End time must be after start time');
                return;
            }
        }

        setSlots(next);
        validateAll(next);
    };

    // 用下面这个实现取代原来的 handleAddRow()
    const handleAddRow = () => {
        // 找到当前所有 slots 同一天(day_of_week)的列表并按 end_time 排序
        const lastPerDay: Record<number, Slot> = {};
        slots.forEach(s => {
            const prev = lastPerDay[s.day_of_week];
            if (!prev || dayjs(s.end_time, timeFormat).isAfter(dayjs(prev.end_time, timeFormat))) {
                lastPerDay[s.day_of_week] = s;
            }
        });

        // 选一个默认新 day
        const used = new Set(slots.map(s => s.day_of_week));
        let newDay = 0;
        for (; newDay < 7; newDay++) {
            if (!used.has(newDay)) break;
        }

        // 计算 start/end
        let newStart = '00:00', newEnd = '01:00';
        const last = lastPerDay[newDay];
        if (last) {
            const lastEnd = dayjs(last.end_time, timeFormat);
            newStart = lastEnd.add(1, 'hour').format(timeFormat);
            newEnd   = lastEnd.add(2, 'hour').format(timeFormat);
        }

        setSlots([
            ...slots,
            { day_of_week: newDay, start_time: newStart, end_time: newEnd }
        ]);
        validateAll([
            ...slots,
            { day_of_week: newDay, start_time: newStart, end_time: newEnd }
        ]);
    };

    // 删除某一天的时间段
    const handleRemoveRow = (i: number) => {
        const next = slots.filter((_, idx) => idx !== i);
        setSlots(next);
        validateAll(next);
        if (next.length === 0) {
            message.info('Please keep at least one available time slot.');
        }
    };

    const handleBlockRangeChange = async (
        dates: ([Dayjs | null, Dayjs | null] | null),
        dateStrings: [string, string]
    ) => {
        if (!dates) return;
        const [startDay, endDay] = dates;
        if (!startDay || !endDay) return;

        const dayCount = endDay.diff(startDay, 'day');
        setLoading(true);

        try {
            for (let i = 0; i <= dayCount; i++) {
                const localDay = startDay.add(i, 'day');

                // Dayjs → JavaScript Date → ISO string （UTC）
                const utcStart = localDay.startOf('day').utc().toDate().toISOString();
                const utcEnd   = localDay.endOf('day').utc().toDate().toISOString();

                await fetch(`/api/availability_block/${userId}/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        start_date: utcStart,
                        end_date:   utcEnd,
                    }),
                });
            }

            message.success(`Blocked dates from ${dateStrings[0]} to ${dateStrings[1]}`);
            await fetchBlocks();
        } catch (err: any) {
            message.error('Failed to add blocked date: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    // 删除某一个已屏蔽日期
    const handleDeleteBlock = async (blockId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/availability_block/${userId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ block_id: blockId }),
            });
            const payload = await res.json();
            if (payload.error) throw new Error(payload.error);
            message.success('Blocked date removed');
            await fetchBlocks();
        } catch (err: any) {
            message.error('Failed to delete blocked date:' + err.message);
        } finally {
            setLoading(false);
        }
    };

// 单行校验
    function getSlotError(slot: Slot, idx: number, all: Slot[]): string | undefined {
        const start = dayjs(slot.start_time, timeFormat);
        const end   = dayjs(slot.end_time,   timeFormat);
        if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
            return 'End time must be after start time';
        }
        if (end.diff(start, 'hour', true) < 1) {
            return 'Slot must be at least 1 hour';
        }
        // 同一天不重叠
        for (let j = 0; j < all.length; j++) {
            if (j === idx) continue;
            const o = all[j];
            if (o.day_of_week !== slot.day_of_week) continue;
            const oStart = dayjs(o.start_time, timeFormat);
            const oEnd   = dayjs(o.end_time,   timeFormat);
            if (start.isBefore(oEnd) && end.isAfter(oStart)) {
                return `Overlaps with ${o.start_time}-${o.end_time}`;
            }
        }
        return;
    }

// 批量校验并写入 state
    function validateAll(slotsArr: Slot[]) {
        const errs: Record<number,string> = {};
        slotsArr.forEach((s, i) => {
            const e = getSlotError(s, i, slotsArr);
            if (e) errs[i] = e;
        });
        setSlotErrors(errs);
    }


    return (
        <div>
            {/* Weekly Available Hours */}
            <Card
                title="Weekly Available Hours"
                loading={loading}
                style={{ marginBottom: 24 }}
                bodyStyle={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Space direction="vertical" size="middle" style={{ width: 476 }}>
                    {dayNames.map((dayName, dayIndex) => {
                        const daySlots = slots.filter(s => s.day_of_week === dayIndex);
                        const isUnavailable = daySlots.length === 0;

                        return (
                            <div
                                key={dayIndex}
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                {/* 星期几按钮 */}
                                <Button
                                    size="small"
                                    style={{
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '1px 1px',
                                        width: 120,
                                        height: 32,
                                        background: isUnavailable ? '#f5f5f5' : '#ffffff',
                                        border: '1px solid #D9D9D9',
                                        boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.016)',
                                        borderRadius: 2,
                                        flex: 'none',
                                        order: 0,
                                        flexGrow: 0,
                                    }}
                                >
                                    {dayName}
                                </Button>

                                {/* 新增一天的按钮 */}
                                <Button
                                    size="small"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 20,
                                        height: 20,
                                        padding: 0,
                                        border: 'none',
                                        borderRadius: 0,
                                        margin: 8,
                                        lineHeight: '11px',
                                        fontSize: 10,
                                    }}
                                    onClick={() => {
                                        const next = [
                                            ...slots,
                                            {
                                                day_of_week: dayIndex,
                                                start_time: '18:00',
                                                end_time: '19:00',
                                            },
                                        ];
                                        setSlots(next);
                                    }}
                                >
                                    <img
                                        src="/images/button/plus.png"
                                        alt="Add"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Button>

                                {/* 显示当天的时间段列表 */}
                                <div
                                    key={dayIndex}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        width: '100%',
                                    }}
                                >
                                    {isUnavailable ? (
                                        <span style={{ color: '#999', textAlign: 'center', width: '100%' }}>
        Unavailable
      </span>
                                    ) : (
                                        daySlots.map((slot, idxInDay) => {
                                            // 计算全局索引
                                            const globalIdx = slots.findIndex(
                                                s =>
                                                    s.day_of_week === slot.day_of_week &&
                                                    s.start_time === slot.start_time &&
                                                    s.end_time === slot.end_time
                                            );

                                            return (
                                                <React.Fragment key={globalIdx}>
                                                    <Row gutter={8} align="middle" style={{ marginBottom: 4 }}>
                                                        <Col>
                                                            <TimeRangePicker
                                                                className={styles['centered-range-picker']}
                                                                allowClear={false}
                                                                placeholder={['Start', 'End']}
                                                                format={timeFormat}
                                                                hourStep={1}
                                                                minuteStep={60 as any}
                                                                style={{
                                                                    width: '100%',
                                                                    borderRadius: 2,
                                                                    paddingRight: 40,
                                                                }}
                                                                value={[
                                                                    dayjs(slot.start_time, timeFormat),
                                                                    dayjs(slot.end_time, timeFormat),
                                                                ]}
                                                                onChange={values => {
                                                                    const [start, end] = values || [];
                                                                    updateSlot(globalIdx, {
                                                                        start_time: start
                                                                            ? start.format(timeFormat)
                                                                            : slot.start_time,
                                                                        end_time: end
                                                                            ? end.format(timeFormat)
                                                                            : slot.end_time,
                                                                    });
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: 12,
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    fontSize: 14,
                                                                    color: '#000',
                                                                    pointerEvents: 'none',
                                                                }}
                                                            >
                  {tzAbbr}
                </span>
                                                        </Col>
                                                        <Col>
                                                            <Button
                                                                type="text"
                                                                onClick={() => handleRemoveRow(globalIdx)}
                                                                style={{
                                                                    width: 14,
                                                                    height: 14,
                                                                    padding: 0,
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                }}
                                                            >
                                                                <img
                                                                    src="/images/button/close.png"
                                                                    alt="Remove"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                                />
                                                            </Button>
                                                        </Col>
                                                    </Row>

                                                    {/* 如果有校验错误，则在这一行下面显示 */}
                                                    {slotErrors[globalIdx] && (
                                                        <div style={{ color: 'red', marginLeft: 140 }}>
                                                            {slotErrors[globalIdx]}
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <Row gutter={16}>
                        <Col>
                            <Button
                                style={{ borderRadius: 2 }}
                                onClick={() => setSlots(originalSlots)}
                            >
                                Cancel
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                style={{
                                    borderRadius: 2,
                                    backgroundColor: '#1890ff',
                                    borderColor: '#1890ff',
                                }}
                                disabled={Object.keys(slotErrors).length > 0}
                                onClick={() => handleSaveSlots()}
                            >
                                Save changes
                            </Button>
                        </Col>
                    </Row>
                </Space>
            </Card>

            {/* Block Dates：用 DatePicker.RangePicker 来选一个连续的日期区间 */}
            <Card title="Block Dates" loading={loading}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <DateRangePicker
                        style={{ width: 300 }}
                        disabledDate={current =>
                            current && current.isBefore(dayjs().startOf('day'))
                        }
                        onChange={handleBlockRangeChange}
                    />

                    {/* 已屏蔽的单日，用 Tag 展示 */}
                    <div style={{ marginTop: 12 }}>
                        <Space wrap>
                            {blocks
                                .filter(b => {
                                    const d = dayjs(b.blocked_range, 'YYYY-MM-DD');
                                    return d.isSame(dayjs(), 'day') || d.isAfter(dayjs(), 'day');
                                })
                                .map(b => {
                                    const m = b.blocked_range.match(/\d{4}-\d{2}-\d{2}/);
                                    const dayStr = m ? m[0] : '(invalid date)';
                                    return (
                                        <Tag
                                            key={b.id}
                                            icon={<LockOutlined />}
                                            closable
                                            style={{ borderRadius: 2, userSelect: 'none' }}
                                            onClose={() => handleDeleteBlock(b.id)}
                                        >
                                            {dayStr}
                                        </Tag>
                                    );
                                })}
                        </Space>
                    </div>
                </Space>
            </Card>
        </div>
    );
}
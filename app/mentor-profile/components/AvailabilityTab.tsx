'use client';

import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import styles from './AvailabilityTab.module.css';
import {
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


export default function AvailabilityTab({ userId }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [originalSlots, setOriginalSlots] = useState<Slot[]>([]);
    const [blocks, setBlocks] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});
    const [blockStart, setBlockStart] = useState<Dayjs | null>(null);
    const [blockEnd, setBlockEnd] = useState<Dayjs | null>(null);
    const WHOLE_HOUR_MSG = 'Time must be on the hour (e.g., 09:00, 10:00).';
    const isWholeHour = (d: Dayjs) => d.isValid() && d.minute() === 0;
    const isWholeHourStr = (s: string) => isWholeHour(dayjs(s, timeFormat));
    const [userTimezone, setUserTimezone] = useState<string | null>(null);

    const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];
    useEffect(() => {
        if (!userId) return;

        (async () => {
            const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // 先获取 database 现存 timezone
            const res = await fetch(`/api/user/${userId}`);
            const json = await res.json();
            const dbTz = json.data?.timezone;

            // 只有不同才更新
            if (dbTz !== localTz) {
                await fetch(`/api/user/${userId}/timezone`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timezone: localTz }),
                });
            }
        })();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        (async () => {
            try {
                const res  = await fetch(`/api/user/${userId}`, {
                    method: 'GET'
                });
                const json = await res.json();

                // 你的 getUser API 返回 { data: <User> }
                const timezone = json.data?.timezone ?? null;

                setUserTimezone(timezone);
            } catch (e) {
                console.error('Failed to load user timezone', e);
                setUserTimezone(null);
            }
        })();
    }, [userId]);

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
            fetch(`/api/availability/${userId}/get`).then(r => r.json()),
            fetchBlocks(),
        ])
            .then(([availRes]) => {

                const list = availRes.data?.availabilities || [];  // ← 修复

                const fetchedSlots: Slot[] = list.map((item: any) => {
                    const start = item.start_time_local.slice(0, 5);
                    const end   = item.end_time_local.slice(0, 5);

                    return {
                        day_of_week: item.day_of_week,
                        start_time:  start,
                        end_time:    end,
                    };
                });

                console.log("fetchedSlots:", fetchedSlots);

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

        try {
            // 这里 slotsToSave 已经是「本地时区下」的 day_of_week + HH:mm
            // 直接传给后端，后端会按用户 timezone 解释
            const payload = {
                user_id: userId,
                availabilities: slotsToSave.map(s => ({
                    day_of_week: s.day_of_week,
                    start_time:  s.start_time, // "HH:mm"
                    end_time:    s.end_time,   // "HH:mm"
                })),
            };

            console.log("📦 payload for /api/availability/update:", payload);

            const res = await fetch('/api/availability/update', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(errText || `HTTP ${res.status}`);
            }
            message.success('Weekly availability updated successfully.');
            setOriginalSlots([...slotsToSave]);
        } catch (err: any) {
            message.error('Failed to update availability: ' + err.message);
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
// 不允许选择今天之前
    const disablePast = (current: Dayjs) =>
        !!current && current.isBefore(dayjs().startOf('day'));

// End Date 不能早于 Start Date，也不能选今天之前
    const disableEndDate = (current: Dayjs) => {
        if (!current) return false;
        const beforeToday = current.isBefore(dayjs().startOf('day'));
        if (blockStart) {
            return beforeToday || current.isBefore(blockStart.startOf('day'));
        }
        return beforeToday;
    };

// 保存 Block 区间：把 [start, end] 按天逐个写入（与原逻辑一致）
    const handleBlockSave = async () => {
        if (!blockStart || !blockEnd) {
            message.error('Please select both start and end dates');
            return;
        }
        if (blockEnd.isBefore(blockStart, 'day')) {
            message.error('End date must be on or after start date');
            return;
        }

        setLoading(true);
        try {
            const startDay = blockStart.startOf('day');
            const endDay = blockEnd.startOf('day');
            const dayCount = endDay.diff(startDay, 'day');

            for (let i = 0; i <= dayCount; i++) {
                const localDay = startDay.add(i, 'day');
                const utcStart = localDay.startOf('day').utc().toDate().toISOString();
                const utcEnd = localDay.endOf('day').utc().toDate().toISOString();

                const res = await fetch(`/api/availability_block/${userId}/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        start_date: utcStart,
                        end_date: utcEnd,
                    }),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(text || `HTTP ${res.status}`);
                }
            }

            message.success(`Blocked ${dayCount + 1} day${dayCount ? 's' : ''}`);
            await fetchBlocks();        // 重新拉取列表
            setBlockStart(null);        // 清空表单
            setBlockEnd(null);
        } catch (err: any) {
            message.error('Failed to add blocked dates: ' + err.message);
        } finally {
            setLoading(false);
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

        // 必须是合法时间，且 end > start
        if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
            return 'End time must be after start time';
        }

        // 必须整点（分钟为 00）
        if (!isWholeHour(start) || !isWholeHour(end)) {
            return WHOLE_HOUR_MSG;
        }

        // 至少 1 小时
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
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Weekly Available Hours</span>
                        {userTimezone && (
                            <span style={{ fontSize: 12, color: '#999' }}>
                    All times in {userTimezone}
                </span>
                        )}
                    </div>
                }
                loading={loading}
                style={{ marginBottom: 24 }}
                bodyStyle={{ paddingBottom: 16 }}
            >
                <div className={styles.weeklyCardBody}>
                    {dayNames.map((dayName, dayIndex) => {
                        const daySlots = slots.filter(s => s.day_of_week === dayIndex);
                        const isUnavailable = daySlots.length === 0;

                        return (
                            <div key={dayIndex} className={styles.dayRow}>
                                {/* 左侧：星期 + 加号 */}
                                <div className={styles.dayHeader}>
                                    <Button
                                        size="small"
                                        className={styles.dayBtn}
                                        style={{
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: '1px 1px',
                                            height: 32,
                                            background: isUnavailable ? '#f5f5f5' : '#ffffff',
                                            border: '1px solid #D9D9D9',
                                            boxShadow: '0 2px 0 rgba(0,0,0,0.016)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        {dayName}
                                    </Button>

                                    <Button
                                        size="small"
                                        className={styles.plusBtn}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 16,
                                            height: 16,
                                            padding: 0,
                                            border: 'none',
                                            borderRadius: 0,
                                        }}
                                        onClick={() => {
                                            const next = [
                                                ...slots,
                                                { day_of_week: dayIndex, start_time: '18:00', end_time: '19:00' },
                                            ];
                                            setSlots(next);
                                        }}
                                    >
                                        <img
                                            src="/images/button/plus.png"
                                            alt="Add"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </Button>
                                </div>

                                {/* 右侧：当天的所有时间段（手机下会换到下一行并 100% 宽） */}
                                <div className={styles.slotsCol}>
                                    {isUnavailable ? (
                                        <span style={{ color: '#999', textAlign: 'center', width: '100%' }}>
                Unavailable
              </span>
                                    ) : (
                                        daySlots.map((slot) => {
                                            // 全局索引
                                            const globalIdx = slots.findIndex(
                                                s =>
                                                    s.day_of_week === slot.day_of_week &&
                                                    s.start_time === slot.start_time &&
                                                    s.end_time === slot.end_time
                                            );

                                            return (
                                                <React.Fragment key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}>
                                                    <div className={styles.timeRow}>
                                                        <div className={styles.timePickerWrap}>
                                                            <TimeRangePicker
                                                                allowClear={false}
                                                                placeholder={['Start', 'End']}
                                                                format={timeFormat}
                                                                hourStep={1}
                                                                minuteStep={60 as any}
                                                                size="middle"
                                                                style={{
                                                                    width: '100%',
                                                                    borderRadius: 2,
                                                                    paddingRight: 48, // 给时区缩写留位置
                                                                }}
                                                                value={[
                                                                    dayjs(slot.start_time, timeFormat),
                                                                    dayjs(slot.end_time, timeFormat),
                                                                ]}
                                                                onChange={values => {
                                                                    const [start, end] = values || [];
                                                                    updateSlot(globalIdx, {
                                                                        start_time: start ? start.format(timeFormat) : slot.start_time,
                                                                        end_time: end ? end.format(timeFormat) : slot.end_time,
                                                                    });
                                                                }}
                                                            />

                                                        </div>

                                                        <Button
                                                            type="text"
                                                            onClick={() => handleRemoveRow(globalIdx)}
                                                            className={styles.deleteBtn}
                                                        >
                                                            <img
                                                                src="/images/button/close.png"
                                                                alt="Remove"
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                            />
                                                        </Button>
                                                    </div>

                                                    {slotErrors[globalIdx] && (
                                                        <div style={{ color: 'red' }}>
                                          T                  {slotErrors[globalIdx]}
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

                    {/* 按钮行：手机下自动换行，不会顶出容器 */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Button
                            style={{ borderRadius: 2 }}
                            onClick={() => setSlots(originalSlots)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            style={{ borderRadius: 2, backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            disabled={Object.keys(slotErrors).length > 0}
                            onClick={() => handleSaveSlots()}
                        >
                            Save changes
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Block Dates：用 DatePicker.RangePicker 来选一个连续的日期区间 */}
            <Card title="Block Dates" loading={loading}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Row
                        gutter={[{ xs: 12, sm: 24, md: 24 }, 12]}
                        align="middle"
                        justify="start" // 左对齐
                    >
                        <Col xs={24} sm="auto">
                            <Space direction="vertical" size={4}>
                                <span style={{ fontWeight: 500 }}>Start Date</span>
                                <DatePicker
                                    value={blockStart}
                                    onChange={(d) => setBlockStart(d)}
                                    disabledDate={disablePast}
                                    style={{ width: 220 }}
                                    placement="bottomLeft"
                                />
                            </Space>
                        </Col>

                        <Col xs={24} sm="auto">
                            <Space direction="vertical" size={4}>
                                <span style={{ fontWeight: 500 }}>End Date</span>
                                <DatePicker
                                    value={blockEnd}
                                    onChange={(d) => setBlockEnd(d)}
                                    disabledDate={disableEndDate}
                                    style={{ width: 220 }}
                                    placement="bottomLeft"
                                />
                            </Space>
                        </Col>

                        <Col xs={24} md="auto">
                            <Space wrap>
                                <Button
                                    type="primary"
                                    className={styles.btnPrimary}
                                    onClick={handleBlockSave}
                                    disabled={!blockStart || !blockEnd || blockEnd.isBefore(blockStart, 'day')}
                                >
                                    Save
                                </Button>

                                <Button
                                    className={styles.btnPlain}
                                    onClick={() => { setBlockStart(null); setBlockEnd(null); }}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    {/* 已屏蔽单日 Tag 展示（保留你原来的实现） */}
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
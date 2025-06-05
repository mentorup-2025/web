'use client';

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

export default function AvailabilityTab({ userId }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [blocks, setBlocks] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(false);

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
            message.error('无法加载屏蔽日期');
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
                // 后端返回示例（代码中假设）：
                // {
                //   code: 0,
                //   message: "ok",
                //   data: [
                //     {
                //       id: "...",
                //       mentor_id: "...",
                //       weekday: 6,
                //       start_time: "18:00:00",
                //       end_time: "22:00:00"
                //     }
                //   ]
                // }
                //
                // 我们把它映射成前端内部使用的 Slot[] 格式：
                const byDay: Record<number, Slot> = {};
                (availRes.data || []).forEach((item: any) => {
                    // 后端字段叫 weekday，前端内部叫 day_of_week
                    const dow = item.weekday as number;
                    // 把 "HH:mm:ss" 截成 "HH:mm"
                    const hhmmStart = (item.start_time as string).slice(0, 5);
                    const hhmmEnd = (item.end_time as string).slice(0, 5);

                    if (!byDay[dow]) {
                        byDay[dow] = {
                            day_of_week: dow,
                            start_time: hhmmStart,
                            end_time: hhmmEnd,
                        };
                    }
                });

                setSlots(Object.values(byDay));
            })
            .catch(() => {
                message.error('加载可用时间失败');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId, fetchBlocks]);

    // 保存「Weekly Available Hours」
    const handleSaveSlots = async (slotsToSave: Slot[] = slots) => {
        setLoading(true);

        // client-side 验证：保证 start < end
        const isValidSlots = slotsToSave.every(slot => {
            const start = dayjs(slot.start_time, timeFormat);
            const end = dayjs(slot.end_time, timeFormat);
            return start.isValid() && end.isValid() && end.isAfter(start);
        });
        if (!isValidSlots) {
            message.error('Invalid time slots - please check your times');
            setLoading(false);
            return;
        }

// 在 handleSaveSlots(...) 内
        try {
            // 构造请求体，注意后端期望字段名是 weekday
            const payload = {
                user_id: userId,
                availabilities: slotsToSave.map(s => ({
                    day_of_week: s.day_of_week, // 后端要求字段叫 weekday
                    start_time: s.start_time,
                    end_time: s.end_time,
                })),
            };

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
            message.success('Weekly availability 已更新');
            // （可选）如果你想再重新拉一次最新数据：
            // const refreshed = await fetch(`/api/availability/${userId}/get`).then(r => r.json());
            // // 同步刷新 UI
            // const byDay: Record<number, Slot> = {};
            // (refreshed.data || []).forEach((item: any) => {
            //   const dow = item.weekday;
            //   const hhmmStart = (item.start_time as string).slice(0, 5);
            //   const hhmmEnd = (item.end_time as string).slice(0, 5);
            //   if (!byDay[dow]) {
            //     byDay[dow] = {
            //       day_of_week: dow,
            //       start_time: hhmmStart,
            //       end_time: hhmmEnd,
            //     };
            //   }
            // });
            // setSlots(Object.values(byDay));
        } catch (err: any) {
            message.error('更新可用时间失败：' + err.message);
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
        handleSaveSlots(next);
    };

    // 给某一天添加默认时间段
    const handleAddRow = () => {
        const used = new Set(slots.map(s => s.day_of_week));
        let newDay = 0;
        for (let d = 0; d < 7; d++) {
            if (!used.has(d)) {
                newDay = d;
                break;
            }
        }
        const next = [
            ...slots,
            {
                day_of_week: newDay,
                start_time: '18:00',
                end_time: '19:00',
            },
        ];
        setSlots(next);
    };

    // 删除某一天的时间段
    const handleRemoveRow = (i: number) => {
        const next = slots.filter((_, idx) => idx !== i);
        setSlots(next);
        if (next.length === 0) {
            message.info('请至少保留一条可用时间');
        } else {
            handleSaveSlots(next);
        }
    };

    const handleBlockRangeChange = async (
        dates: ([Dayjs | null, Dayjs | null] | null),
        dateStrings: [string, string]
    ) => {
        if (!dates) return;
        const [startDay, endDay] = dates;
        // 注意 startDay 或 endDay 也可能是 null，需要额外校验
        if (!startDay || !endDay) return;

        // 之后可以直接用 startDay 和 endDay（均为 Dayjs 实例）
        const dayCount = endDay.diff(startDay, 'day');
        if (dayCount < 0) return;

        setLoading(true);
        try {
            for (let i = 0; i <= dayCount; i++) {
                const currentDate = startDay.add(i, 'day').format('YYYY-MM-DD');
                await fetch(`/api/availability_block/${userId}/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        start_date: currentDate,
                        end_date: currentDate,
                    }),
                }).then(r => r.json());
            }
            message.success(
                `Blocked dates from ${dateStrings[0]} to ${dateStrings[1]}`
            );
            await fetchBlocks();
        } catch (err: any) {
            message.error('添加屏蔽日期失败：' + err.message);
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
            message.error('删除屏蔽日期失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

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
                                        <span
                                            style={{
                                                color: '#999',
                                                display: 'block',
                                                width: '100%',
                                                textAlign: 'center',
                                            }}
                                        >
                      Unavailable
                    </span>
                                    ) : (
                                        daySlots.map((slot, idx) => (
                                            <Row
                                                key={idx}
                                                gutter={8}
                                                align="middle"
                                                style={{ marginBottom: 4 }}
                                            >
                                                <Col>
                                                    {/* 这里使用 TimePicker.RangePicker 来选时间段 */}
                                                    <TimeRangePicker
                                                        className={styles['centered-range-picker']}
                                                        allowClear={false}
                                                        placeholder={['Start', 'End']}
                                                        format={timeFormat}
                                                        hourStep={1}
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
                                                            updateSlot(idx, {
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
                                                        onClick={() =>
                                                            handleRemoveRow(slots.findIndex(s => s === slot))
                                                        }
                                                        style={{
                                                            width: 14,
                                                            height: 14,
                                                            padding: 0,
                                                            border: 'none',
                                                            background: 'transparent',
                                                            flex: 'none',
                                                            order: 1,
                                                            flexGrow: 0,
                                                        }}
                                                    >
                                                        <img
                                                            src="/images/button/close.png"
                                                            alt="Remove"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'contain',
                                                            }}
                                                        />
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <Row gutter={16}>
                        <Col>
                            <Button
                                style={{ borderRadius: 2 }}
                                onClick={() => location.reload()}
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
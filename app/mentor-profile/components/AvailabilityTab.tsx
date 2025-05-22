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
    Select,
    Tag,
    Space,
    DatePicker,
    message,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const timeFormat = 'HH:mm';

interface Slot {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

interface BlockItem {
    id: string;
    blocked_range: string;
}

interface Props {
    userId: string;
}

export default function AvailabilityTab({ userId }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [blocks, setBlocks] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { RangePicker } = TimePicker;
    const dayNames = [
        'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
    ];
    const [tzAbbr, setTzAbbr] = useState<string>('');

    useEffect(() => {
        // 生成类似 "9:41 PM PDT" 的字符串，再切出最后的缩写
        const parts = new Date()
            .toLocaleTimeString('en-US', { timeZoneName: 'short' })
            .split(' ');
        setTzAbbr(parts[parts.length - 1]);
    }, []);

    // 拉取已屏蔽日期
    const fetchBlocks = useCallback(async () => {
        try {
            const res = await fetch(`/api/availability_block/${userId}`);
            const json = await res.json();
            setBlocks(json.data || []);
        } catch {
            message.error('无法加载屏蔽日期');
        }
    }, [userId]);

    // 拉取 weekly + blocks
    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/availability/${userId}/get`).then(r => r.json()),
            fetchBlocks(),
        ])
            .then(([availRes]) => {
                const byDay: Record<number, Slot> = {};
                (availRes.data || []).forEach((item: any) => {
                    const dow = new Date(item.date).getDay();
                    if (!byDay[dow]) {
                        byDay[dow] = {
                            day_of_week: dow,
                            start_time: item.start_time,
                            end_time: item.end_time,
                        };
                    }
                });
                setSlots(Object.values(byDay));
            })
            .catch(() => message.error('加载可用时间失败'))
            .finally(() => setLoading(false));
    }, [userId, fetchBlocks]);

// Update the handleSaveSlots function with better validation
    const handleSaveSlots = async (slotsToSave: Slot[] = slots) => {
        setLoading(true);

        // Add client-side validation
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

        try {
            const res = await fetch('/api/availability/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    availabilities: slotsToSave.map(s => ({
                        day_of_week: s.day_of_week,
                        start_time: s.start_time,
                        end_time: s.end_time,
                    })),
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const payload = await res.json();
            if (payload.error) throw new Error(payload.error);
            message.success('Weekly availability updated');
        } catch (err: any) {
            message.error('更新可用时间失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

// Update the updateSlot function to validate before saving
    const updateSlot = (i: number, changes: Partial<Slot>) => {
        const next = [...slots];
        next[i] = { ...next[i], ...changes };

        // Validate the new slot
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

// Update the handleAddRow function to ensure valid defaults
    const handleAddRow = () => {
        const used = new Set(slots.map(s => s.day_of_week));
        let newDay = 0;
        for (let d = 0; d < 7; d++) {
            if (!used.has(d)) { newDay = d; break; }
        }

        const next = [
            ...slots,
            {
                day_of_week: newDay,
                start_time: '18:00',
                end_time: '19:00'
            },
        ];
        setSlots(next);

        // Don't auto-save for new rows - let user set times first
        // handleSaveSlots(next);
    };

    // 删除行并自动保存（带空数组保护）
    const handleRemoveRow = (i: number) => {
        const next = slots.filter((_, idx) => idx !== i);
        setSlots(next);

        if (next.length === 0) {
            message.info('请至少保留一条可用时间');  // 或者根据你的产品逻辑，用别的文案
        } else {
            handleSaveSlots(next);
        }
    };

    // 增加屏蔽日期
    const handleAddBlock = async (dateString: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/availability_block/${userId}/insert`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ start_date: dateString, end_date: dateString }),
            });
            const payload = await res.json();
            if (payload.error) throw new Error(payload.error);
            message.success('Blocked date added');
            await fetchBlocks();
        } catch (err: any) {
            message.error('添加屏蔽日期失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 删除屏蔽日期
    const handleDeleteBlock = async (blockId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/availability_block/${userId}/delete`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
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
                    alignItems: 'center'
                }}
            >
                <Space direction="vertical" size="middle" style={{ width: 476}}>
                    {dayNames.map((dayName, dayIndex) => {
                        const daySlots = slots.filter(s => s.day_of_week === dayIndex);
                        const isUnavailable = daySlots.length === 0;

                        return (
                            <div key={dayIndex} style={{ display: 'flex', alignItems: 'center'  }}>

                                <Button
                                    size="small"
                                    style={{
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '1px 1px 1px 1px',
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
                                        // 垂直对齐修正
                                        lineHeight: '11px',
                                        fontSize: 10,

                                    }}
                                    onClick={() => {
                                        const next = [
                                            ...slots,
                                            {
                                                day_of_week: dayIndex,
                                                start_time: '18:00',
                                                end_time: '19:00'
                                            },
                                        ];
                                        setSlots(next);
                                    }}
                                >
                                    <img
                                        src="/images/button/plus.png"    // 替换为你的 PNG 路径
                                        alt="Add"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Button>
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
                                                textAlign: 'center'
                                            }}
                                        >Unavailable</span>
                                    ) : (
                                        daySlots.map((slot, idx) => (
                                            <Row key={idx} gutter={8} align="middle" style={{ marginBottom: 4 }}>
                                                <Col>
                                                    <RangePicker
                                                        className={styles['centered-range-picker']}
                                                        allowClear={false}
                                                        placeholder={['Outlined Start', 'Outlined End']}
                                                        format={timeFormat}
                                                        hourStep={1}
                                                        style={{
                                                            width: '100%',
                                                            borderRadius: 2,
                                                            paddingRight: 40
                                                        }}
                                                        value={[
                                                            dayjs(slot.start_time, timeFormat),
                                                            dayjs(slot.end_time, timeFormat)
                                                        ]}
                                                        onChange={(values) => {
                                                            const [start, end] = values || [];
                                                            updateSlot(idx, {
                                                                start_time: start ? start.format(timeFormat) : slot.start_time,
                                                                end_time: end ? end.format(timeFormat) : slot.end_time,
                                                            });
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            right: 12,                 // 根据需要微调
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            fontSize: 14,
                                                            color: '#000',
                                                            pointerEvents: 'none',     // 不影响点击
                                                        }}
                                                    >
                                                    {tzAbbr}
                                                    </span>

                                                </Col>


                                                <Col>
                                                    <Button
                                                        type="text"
                                                        onClick={() => handleRemoveRow(slots.findIndex(s => s === slot))}
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
                                    borderColor: '#1890ff'
                                }}
                                onClick={() => handleSaveSlots()}
                            >
                                Save changes
                            </Button>
                        </Col>
                    </Row>
                </Space>
            </Card>


            {/* Block Dates */}
            <Card title="Block Dates" loading={loading}>
                <Space wrap style={{ marginBottom: 12 }}>
                    <DatePicker
                        placeholder="Select date"
                        style={{ borderRadius: 2 }}
                        disabledDate={current => current && current.isBefore(dayjs().startOf('day'))}
                        onChange={(_d, dateStr) => {
                            if (typeof dateStr === 'string') {
                                handleAddBlock(dateStr);
                            }
                        }}
                    />
                </Space>

                <div style={{ marginTop: 12 }}>
                    <Space wrap>
                        {blocks
                            .filter(b => {
                            const date = dayjs(b.blocked_range, 'YYYY-MM-DD');
                            return date.isSame(dayjs(), 'day') || date.isAfter(dayjs(), 'day');
                        })
                            .map(b => {
                            const m = b.blocked_range.match(/\d{4}-\d{2}-\d{2}/);
                            const start = m ? m[0] : '(invalid date)';
                            return (
                                <Tag
                                    key={b.id}
                                    icon={<LockOutlined />}
                                    closable
                                    style={{ borderRadius: 2, userSelect: 'none' }}
                                    onClose={() => handleDeleteBlock(b.id)}
                                >
                                    {start}
                                </Tag>
                            );
                        })}
                    </Space>
                </div>
            </Card>
        </div>
    );
}
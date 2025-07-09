'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Card,
    Typography,
    Avatar,
    Tag,
    Space,
    message,
    Spin,
    Empty,
    Modal,
    Form,
    DatePicker,
    Button,
    Radio
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    FileOutlined,
    CalendarTwoTone,
    CloseCircleOutlined,
    FrownOutlined,
    BellOutlined,
    MinusCircleOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { useUser } from '@clerk/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

interface Proposal {
    id: string;
    appointment_id: string;
    proposed_time_ranges: [string, string][];
    status: 'pending' | 'accepted' | 'declined';
}

interface Appointment {
    id: string;
    date: string;
    time: string;
    status: string;
    description: string;
    resume_url?: string;
    otherUser: {
        id: string;
        username: string;
        avatar_url?: string;
    };
    proposal?: Proposal;
}
const RescheduleModal = ({
                             visible,
                             onCancel,
                             onSubmit,
                         }: {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (ranges: [string, string][]) => Promise<void>;
}) => {
    const [form] = Form.useForm();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const ranges: [string, string][] = values.slots.map(
                (r: [dayjs.Dayjs, dayjs.Dayjs]) => [r[0].toISOString(), r[1].toISOString()]
            );
            await onSubmit(ranges);
            form.resetFields();
        } catch (err: any) {
            message.error(err.message || 'Submission failed');
        }
    };

    return (
        <Modal
            title="Reschedule Session"
            visible={visible}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            okText="Submit"
        >
            <p style={{ marginBottom: 12, fontStyle: 'italic' }}>
                Please suggest 3–5 one-hour time slots (whole hours only)
            </p>
            <Form form={form} layout="vertical" name="rescheduleForm">
                <Form.List name="slots" initialValue={[]}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name]}
                                        rules={[
                                            { required: true, message: 'Required' },
                                            {
                                                validator: (_, value: [dayjs.Dayjs, dayjs.Dayjs]) => {
                                                    if (!value || value.length !== 2) {
                                                        return Promise.reject('Pick a range');
                                                    }
                                                    const [s, e] = value;
                                                    if (s.minute() !== 0 || e.minute() !== 0) {
                                                        return Promise.reject('Must be whole hours');
                                                    }
                                                    if (e.diff(s, 'hour') !== 1) {
                                                        return Promise.reject('Duration must be 1 hour');
                                                    }
                                                    return Promise.resolve();
                                                },
                                            },
                                        ]}
                                    >
                                        <DatePicker.RangePicker
                                            showTime={{ format: 'HH:mm', minuteStep: 60 }}
                                            format="YYYY-MM-DD HH:mm"
                                        />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                    disabled={fields.length >= 5}
                                >
                                    Add time slot
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};
export default function MySessionsTab() {
    const { user } = useUser();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedProposal, setSelectedProposal] = useState<Record<string, number>>({});

    // Reschedule modal state
    const [repModalVisible, setRepModalVisible] = useState(false);
    const [repTarget, setRepTarget] = useState<{ apptId: string; propId: string } | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentAppt, setCurrentAppt] = useState<Appointment | null>(null);
    const [form] = Form.useForm();
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)


    const fetchAppointments = useCallback(async () => {
        if (!user?.id) return;

        (async () => {
            setLoading(true);
            try {
                // 1) 拿到所有 appointments
                const apptRes = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ user_id: user.id }),
                });
                const apptJson = await apptRes.json();
                const rawAppts = apptJson.data.appointments as any[];

                // 2) 预载入每条 appointment “另一方” 的 user info
                //    如果当前登录的是导师，另一方就是 mentee_id
                const otherIds = Array.from(new Set(
                    rawAppts.map(a => a.mentor_id === user.id ? a.mentee_id : a.mentor_id)
                ));
                const userMap: Record<string, any> = {};
                await Promise.all(otherIds.map(async id => {
                    const ures = await fetch(`/api/user/${id}`);
                    const { data } = await ures.json();
                    if (data) userMap[id] = data;
                }));

                // 3) 为每条 appointment 拉它专属的 proposal
                const enriched = await Promise.all(rawAppts.map(async a => {
                    // parse timeslot…
                    const m = a.time_slot.match(/\[(.*?),(.*?)\)/) || [];
                    const start = m[1] ? dayjs.utc(m[1]).local() : dayjs.invalid;
                    const end   = m[2] ? dayjs.utc(m[2]).local() : dayjs.invalid;

                    const otherId = a.mentor_id === user.id ? a.mentee_id : a.mentor_id;

                    // --- 关键：这里用 otherId 去拉提案列表 ---
                    const pRes = await fetch(`/api/reschedule_proposal/${otherId}`);
                    const pJson = await pRes.json();
                    let proposal: Proposal|undefined = undefined;
                    if (pRes.ok && pJson.code === 0 && Array.isArray(pJson.data)) {
                        const pItem = (pJson.data as any[]).find(p => p.id === a.id);
                        if (pItem) {
                            proposal = {
                                id:       pItem.id,
                                appointment_id: pItem.id,
                                proposed_time_ranges: pItem.proposed_time,
                                status:   'pending',
                            };
                        }
                    }

                    return {
                        id:          a.id,
                        date:        start.isValid() ? start.format('YYYY-MM-DD') : 'Invalid',
                        time:        start.isValid() && end.isValid()
                            ? `${start.format('HH:mm')} - ${end.format('HH:mm')}`
                            : 'Invalid',
                        status:      a.status,
                        description: a.description,
                        resume_url:  a.resume_url,
                        otherUser: {
                            id:       otherId,
                            username: userMap[otherId]?.username || 'Anonymous',
                        },
                        proposal,    // ← 一定要把它放进来
                    };
                }));

                setAppointments(enriched);
            } catch (e: any) {
                console.error(e);
                message.error(e.message || '加载失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Accept：更新 appointment（status + time_slot）
    const handleAccept = async (prop: Proposal) => {
        try {
            const selectedIdx = selectedProposal[prop.appointment_id];
            if (selectedIdx == null) {
                // WARN -> WARNING
                return message.warning('请先选择一个时间段');
            }

            const [start_time, end_time] = prop.proposed_time_ranges[selectedIdx];

            const res = await fetch('/api/appointment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id: prop.appointment_id, start_time, end_time }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '确认失败');

            message.success('已确认新时间');
            setAppointments(apps =>
                apps.map(a =>
                    a.id === prop.appointment_id
                        ? {
                            ...a,
                            status: 'confirmed',
                            proposal: {
                                ...a.proposal!,
                                status: 'accepted',
                            },
                            time: `${dayjs(start_time).format('HH:mm')} - ${dayjs(end_time).format('HH:mm')}`,
                        }
                        : a
                )
            );
        } catch (err: any) {
            console.error(err);
            message.error(err.message);
        }
    };

    const handleDecline = (apptId: string, propId: string) => {
        // 找到被拒绝的那条 appointment
        const appt = appointments.find(a => a.id === apptId)!
        // 记住当前 appointment
        setCurrentAppt(appt)
        // 打开重排弹窗
        setIsRescheduleOpen(true)
    };
    const submitReproposal = async () => {
        if (!repTarget) return;
        try {
            const { range } = await form.validateFields();
            const [s, e] = range;
            await fetch('/api/appointment/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: repTarget.apptId,
                    proposed_time_ranges: [[s.toISOString(), e.toISOString()]],
                    proposer: appointments.find(a => a.id === repTarget.apptId)!.otherUser.id,
                    receiver: user!.id,
                }),
            });
            message.success('已发送新提案');
            setRepModalVisible(false);
            // 重新拉一次
            setLoading(true);
            await new Promise(r => setTimeout(r, 200));
            setLoading(false);
        } catch (e: any) {
            message.error(e.message);
        }
    };

    // 打开重排弹窗
    const showRescheduleModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        form.resetFields();
        setIsRescheduleOpen(true);
    };

    // 确认提交重排
    const handleOk = async () => {
        try {
            const { range } = await form.validateFields();
            if (!currentAppt || !range) return;

            const [start, end] = range;
            const payload = {
                appointment_id: currentAppt.id,
                proposed_time_ranges: [[start.toISOString(), end.toISOString()]],
                proposer: currentAppt.otherUser.id,
                receiver: user!.id,
            };

            const res = await fetch('/api/appointment/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');

            // 1. 通知成功
            message.success('Reschedule request sent!');

            // 2. 更新这条预约的状态为 "reschedule_in_progress"
            setAppointments((prev) =>
                prev.map((appt) =>
                    appt.id === currentAppt.id
                        ? { ...appt, status: 'reschedule_in_progress' }
                        : appt
                )
            );

            // 3. 关闭弹窗
            setIsModalVisible(false);
            setCurrentAppt(null);
        } catch (err: any) {
            message.error(err.message || 'Submission failed');
        }
    };

    // 取消弹窗
    const handleCancel = () => {
        setIsModalVisible(false);
        setCurrentAppt(null);
    };



    return (
        <div style={{ padding: 16 }}>
            <Title level={3}>My Sessions</Title>

            {loading ? (
                <Spin size="large" />
            ) : appointments.length === 0 ? (
                <Empty description="No sessions found." />
            ) : (
                appointments.map((appt) => (
                    <Card
                        key={appt.id}
                        style={{ marginBottom: 16 }}
                        title={
                            <Space>
                                <CalendarOutlined /> {appt.date}
                                <ClockCircleOutlined style={{ marginLeft: 16 }} /> {appt.time}
                                <Tag color="blue">{appt.status}</Tag>
                            </Space>
                        }
                        actions={[
                            <div
                                key="reschedule"
                                onClick={() => {
                                    if (appt.proposal?.status === 'pending') {
                                        message.warning('Please handle the mentee’s reschedule request first.');
                                    } else {
                                        showRescheduleModal(appt);
                                    }
                                }}
                                style={appt.proposal?.status === 'pending'
                                    ? { opacity: 0.5, cursor: 'not-allowed' }
                                    : { cursor: 'pointer' }}
                            >
                                <CalendarTwoTone style={{ fontSize: 18 }} />
                                <div>Reschedule</div>
                            </div>,
                            <div key="cancel">
                                <CloseCircleOutlined style={{ fontSize: 18 }} />
                                <div>Cancel</div>
                            </div>,
                            <div key="noshow">
                                <FrownOutlined style={{ fontSize: 18 }} />
                                <div>No Show</div>
                            </div>,
                            <div key="join">
                                <BellOutlined style={{ fontSize: 18 }} />
                                <div>Join</div>
                            </div>,
                        ]}
                    >
                        {/* 如果有 pending 提案，展示 Accept/Decline */}
                        {appt.proposal?.status === 'pending' && (
                            <div
                                style={{
                                    background: '#fff1f0',        // 浅红背景
                                    border: '1px solid #ff4d4f',  // 红色边框
                                    padding: 16,
                                    marginBottom: 16,
                                    borderRadius: 4,
                                }}
                            >
                                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                                    Your mentee requested to reschedule. Please choose a slot or click “Decline”.
                                </Text>

                                <Radio.Group
                                    onChange={e => setSelectedProposal({ [appt.id]: e.target.value })}
                                    value={selectedProposal[appt.id]}
                                    style={{ display: 'block', marginBottom: 16 }}
                                >
                                    {appt.proposal.proposed_time_ranges.map((range, idx) => (
                                        <Radio key={idx} value={idx} style={{ display: 'block', margin: '8px 0' }}>
                                            <Space>
                                                <BellOutlined />
                                                <Text>
                                                    {dayjs(range[0]).format('YYYY-MM-DD HH:mm')} –{' '}
                                                    {dayjs(range[1]).format('HH:mm')}
                                                </Text>
                                            </Space>
                                        </Radio>
                                    ))}
                                </Radio.Group>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <Button
                                        type="primary"
                                        onClick={() => handleAccept(appt.proposal!)}
                                    >
                                        Confirm
                                    </Button>
                                    <Button onClick={() => handleDecline(appt.id, appt.proposal!.id)}>
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Space>
                            <Avatar>{appt.otherUser.username.charAt(0)}</Avatar>
                            <Text strong>{appt.otherUser.username}</Text>
                        </Space>

                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Notes:</Text>
                            <p>{appt.description}</p>
                        </div>

                        {appt.resume_url && (
                            <div style={{ marginTop: 4 }}>
                                <FileOutlined />
                                <a
                                    href={appt.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ marginLeft: 8 }}
                                >
                                    Resume
                                </a>
                            </div>
                        )}
                    </Card>
                ))
            )}

            <RescheduleModal
                visible={isRescheduleOpen}
                onCancel={() => setIsRescheduleOpen(false)}
                onSubmit={async (ranges) => {
                    await fetch('/api/appointment/reschedule', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            appointment_id: currentAppt!.id,
                            proposed_time_ranges: ranges,
                            proposer: currentAppt!.otherUser.id,
                            receiver: user!.id,
                        }),
                    })
                    message.success('已发送新提案')
                    setIsRescheduleOpen(false)
                    fetchAppointments();
                }}
            />
            <Modal
                title="Propose New Time"
                visible={repModalVisible}
                onOk={submitReproposal}
                onCancel={() => setRepModalVisible(false)}
                okText="Send Proposal"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="range"
                        label="Your available time"
                        rules={[{ required: true, message: 'Pick a time range' }]}
                    >
                        <DatePicker.RangePicker
                            showTime
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD HH:mm"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
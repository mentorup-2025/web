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
    /** 主键；这里 Supabase 的逻辑是 id === appointment_id */
    id: string;
    /** 关联的 appointment id */
    appointment_id: string;
    /** [[start, end], …] */
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
    otherUser: { id: string; username: string; avatar_url?: string };
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
                                            // note: build error
                                            // showTime={{ format: 'HH:mm', minuteStep: 60 }}
                                            showTime={{ format: 'HH:mm' }}
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

    // 重新提案弹窗
    const [repModalVisible, setRepModalVisible] = useState(false);
    const [repTarget, setRepTarget] = useState<{ apptId: string; propId: string } | null>(null);
    const [form] = Form.useForm();
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [currentAppt, setCurrentAppt] = useState<Appointment | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchAppointments = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // 1) 获取所有 appointment
            const apptRes = await fetch('/api/appointment/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id }),
            });
            const apptJson = await apptRes.json();
            if (!apptRes.ok || apptJson.code !== 0) {
                throw new Error(apptJson.message || '获取预约失败');
            }
            const rawAppts: any[] = apptJson.data.appointments;

            // 2) 获取这一 mentee 收到的所有 proposals
            const propRes = await fetch(`/api/reschedule_proposal/${user.id}`);
            const propJson = await propRes.json();
            if (!propRes.ok || propJson.code !== 0) {
                throw new Error(propJson.message || '获取提案失败');
            }
            // 转成 Proposal[]
            const allProposals: Proposal[] = (propJson.data as any[]).map(item => ({
                id: item.id,
                appointment_id: item.id,
                proposed_time_ranges: item.proposed_time,
                status: 'pending',
            }));

            // 3) 预加载 otherUser 信息
            const otherIds = Array.from(new Set(
                rawAppts.map(a => a.mentor_id === user.id ? a.mentee_id : a.mentor_id)
            ));
            const userMap: Record<string, any> = {};
            await Promise.all(otherIds.map(async id => {
                const ures = await fetch(`/api/user/${id}`);
                const ujson = await ures.json();
                if (ures.ok && ujson.data) userMap[id] = ujson.data;
            }));

            // 4) enrich 每条 appointment，并关联对应 proposal
            const enriched: Appointment[] = rawAppts.map(a => {
                // 解析 time_slot
                const m = a.time_slot.match(/\[(.*?),(.*?)\)/) || [];
                let start = dayjs(), end = dayjs();
                if (m.length === 3) {
                    start = dayjs.utc(m[1]).local();
                    end   = dayjs.utc(m[2]).local();
                }
                const date = start.format('YYYY-MM-DD');
                const time = `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
                const otherId = a.mentor_id === user.id ? a.mentee_id : a.mentor_id;

                // 从 allProposals 中找出当前 appointment 对应的 proposal
                const proposal = allProposals.find(p => p.appointment_id === a.id);

                return {
                    id: a.id,
                    date,
                    time,
                    status: a.status,
                    description: a.description,
                    resume_url: a.resume_url,
                    otherUser: {
                        id: otherId,
                        username: userMap[otherId]?.username || 'Anonymous',
                        avatar_url: userMap[otherId]?.avatar_url,
                    },
                    proposal,
                };
            });

            setAppointments(enriched);
        } catch (e: any) {
            console.error(e);
            message.error(e.message || '加载会话失败');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // 接受提案
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
    // 拒绝并重新提案
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
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    appointment_id: repTarget.apptId,
                    proposed_time_ranges: [[s.toISOString(), e.toISOString()]],
                    proposer: user!.id,
                    receiver: appointments.find(a=>a.id===repTarget.apptId)!.otherUser.id
                }),
            });
            message.success('已发送新提案');
            setRepModalVisible(false);
            fetchAppointments();
        } catch (err: any) {
            message.error(err.message);
        }
    };
    // 打开重排弹窗
    const showRescheduleModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        setIsRescheduleOpen(true);
    };
    return (
        <>
            <div style={{ padding: 16 }}>
                <Title level={3}>My Sessions</Title>
                {loading ? (
                    <Spin size="large" />
                ) : appointments.length === 0 ? (
                    <Empty description="No sessions found." />
                ) : (
                    appointments.map(appt => (
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
                                            message.warning('Please handle the mentor’s reschedule request first.');
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
                            {appt.proposal?.status === 'pending' && (
                                <div
                                    style={{
                                        background: '#fff1f0', // 浅红背景
                                        border: '1px solid #ff4d4f', // 红色边框
                                        padding: 16,
                                        marginBottom: 16,
                                        borderRadius: 4,
                                    }}
                                >
                                    <Text strong style={{ display: 'block', marginBottom: 12 }}>
                                        Your mentor requested to reschedule. Please choose a slot or click “Propose New Time”.
                                    </Text>

                                    <Radio.Group
                                        onChange={e => setSelectedProposal({ [appt.id]: e.target.value })}
                                        value={selectedProposal[appt.id]}
                                        style={{ display: 'block', marginBottom: '16px' }}
                                    >
                                        {appt.proposal.proposed_time_ranges.map((range, idx) => (
                                            <Radio key={idx} value={idx} style={{ display: 'block', margin: '8px 0' }}>
                                                <Space>
                                                    <BellOutlined />
                                                    <Text>
                                                        {dayjs(range[0]).format('YYYY-MM-DD HH:mm')} – {dayjs(range[1]).format('HH:mm')}
                                                    </Text>
                                                </Space>
                                            </Radio>
                                        ))}
                                    </Radio.Group>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <Button
                                            type="primary"
                                            onClick={() => handleAccept(appt.proposal!)}
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            onClick={() => handleDecline(appt.id, appt.proposal!.id)}
                                        >
                                            Propose New Time
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
            </div>
            <RescheduleModal
                visible={isRescheduleOpen}
                onCancel={() => setIsRescheduleOpen(false)}
                onSubmit={async (ranges) => {
                    // 调后台接口，传 currentAppt!.id 和 ranges
                    await fetch('/api/appointment/reschedule', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            appointment_id: currentAppt!.id,
                            proposed_time_ranges: ranges,
                            proposer: user!.id,
                            receiver: currentAppt!.otherUser.id,
                        }),
                    });
                    message.success('已发送新提案');
                    setIsRescheduleOpen(false);
                    fetchAppointments(); // 如果需要刷新列表
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
                        label="Select your available time"
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
        </>
    );
}
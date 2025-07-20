'use client';

import { useParams } from 'next/navigation';
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
    Input,
    Radio,
    Tabs
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
// import { useUser } from '@clerk/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
// 在组件顶部或合适的位置
function getShortTimeZone() {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
    const parts = dtf.formatToParts(new Date());
    const tz = parts.find(p => p.type === 'timeZoneName')?.value;
    return tz || '';
}
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
    cancel_reason: string;
    resume_url?: string;
    service_type: string;
    otherUser: {
        id: string;
        username: string;
        avatar_url?: string;
    };
    proposal?: Proposal;
}
const bookedSlotsStatePlaceholder: [string, string][] = [];

type FilterKey = 'upcoming' | 'past' | 'cancelled';

export default function MySessionsTab() {
    // const { user } = useUser();
    const params = useParams();
    const mentorId = params?.id as string;
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedProposal, setSelectedProposal] = useState<Record<string, number>>({});

    // Reschedule modal state
    const [currentAppt, setCurrentAppt] = useState<Appointment | null>(null);
    const [form] = Form.useForm();
    const [isRescheduleReasonModalOpen, setIsRescheduleReasonModalOpen] = useState(false);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isRescheduleSlotsModalOpen, setIsRescheduleSlotsModalOpen] = useState(false);
    const [rescheduleComment, setRescheduleComment] = useState('');

    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [exForm] = Form.useForm();

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAppt, setConfirmAppt] = useState<Appointment | null>(null);

    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [bookedSlots, setBookedSlots] = useState<[string,string][]>([]);

    const [filter, setFilter] = useState<FilterKey>('upcoming');

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');


    // 根据 status 来做分类
    const filteredAppointments = appointments.filter(a => {
        if (filter === 'upcoming') {
            return ['confirmed', 'paid', 'reschedule_in_progress'].includes(a.status);
        }
        if (filter === 'past') {
            return a.status === 'completed';
        }
        // cancelled
        return ['canceled', 'noshow'].includes(a.status);
    });
    const handleSlotCalendarChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null], fieldName: number[]) => {
        const [start, end] = dates;
        // 如果只选了开始时间
        if (start && !end) {
            const autoEnd = start.add(1, 'hour');
            // 直接把 form 插入 start + 1h
            form.setFieldsValue({
                slots: form.getFieldValue('slots').map((slot: any, idx: number) =>
                    idx === fieldName[0] ? [start, autoEnd] : slot
                )
            });
            // 冲突检测
            const conflict = bookedSlots.some(([bs, be]) => {
                const bsDay = dayjs(bs), beDay = dayjs(be);
                return start.isBefore(beDay) && autoEnd.isAfter(bsDay);
            });
            if (conflict) {
                message.warning('⚠️ 该时间段与已有的 session 冲突，请重选。');
            }
        }
    };


    const fetchAppointments = useCallback(async () => {
        if (!mentorId) return;

        (async () => {
            setLoading(true);
            try {
                // 1) 拿到所有 appointments
                const apptRes = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ user_id: mentorId }),
                });
                const apptJson = await apptRes.json();
                const rawAppts = apptJson.data.appointments as any[];

                // 2) 预载入每条 appointment “另一方” 的 user info
                //    如果当前登录的是导师，另一方就是 mentee_id
                const otherIds = Array.from(new Set(
                    rawAppts.map(a => a.mentor_id === mentorId ? a.mentee_id : a.mentor_id)
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

                    // note: build error with `dayjs.invalid`
                    // const start = m[1] ? dayjs.utc(m[1]).local() : dayjs.invalid;
                    // const end   = m[2] ? dayjs.utc(m[2]).local() : dayjs.invalid;
                    // note: not ideal, but use today's date as fallback
                    const start = m[1] ? dayjs.utc(m[1]).local() : dayjs.utc(new Date());
                    const end   = m[2] ? dayjs.utc(m[2]).local() : dayjs.utc(new Date());

                    const otherId = a.mentor_id === mentorId ? a.mentee_id : a.mentor_id;

                    // --- 关键：这里用 otherId 去拉提案列表 ---
                    const pRes = await fetch(`/api/reschedule_proposal/${mentorId}`);
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
                        cancel_reason: a.cancel_reason,
                        service_type: a.service_type,
                        resume_url:  a.resume_url,
                        otherUser: {
                            id:       otherId,
                            username: userMap[otherId]?.username || 'Anonymous',
                            mentor:   userMap[otherId]?.mentor    || false,
                        },
                        proposal,    // ← 一定要把它放进来
                    };
                }));

                const onlyMentees = enriched.filter(a => !a.otherUser.mentor);
                setAppointments(onlyMentees);

            } catch (e: any) {
                console.error(e);
                message.error(e.message || '加载失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [mentorId]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);
    const handleConfirmCurrentTime = async (appt: Appointment) => {
        try {
            // 拆分 "HH:mm - HH:mm"
            const [startStr, endStr] = appt.time.split(' - ');
            // 拼成完整的 ISO 时间
            const startISO = dayjs(`${appt.date} ${startStr}`).toISOString();
            const endISO   = dayjs(`${appt.date} ${endStr}`).toISOString();

            const res = await fetch('/api/appointment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: appt.id,
                    start_time: startISO,
                    end_time: endISO,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '确认失败');

            message.success('已确认会话时间');
            // 本地更新状态
            setAppointments(list =>
                list.map(a =>
                    a.id === appt.id
                        ? { ...a, status: 'confirmed', time: `${startStr} - ${endStr}` }
                        : a
                )
            );
        } catch (err: any) {
            console.error(err);
            message.error(err.message || '确认失败');
        }
    };
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
        const appt = appointments.find(a => a.id === apptId)!
        setCurrentAppt(appt)
        setRescheduleComment('')
        setIsRescheduleReasonModalOpen(true)  // ← 直接打开原因输入弹窗
    }


    // 打开重排弹窗
    const showRescheduleModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        setRescheduleComment('');
        setIsRescheduleReasonModalOpen(true);
    };

    const showCancelModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        setCancelReason('');
        setIsCancelOpen(true);
    };

    const handleRescheduleReasonNext = () => {
        setIsRescheduleReasonModalOpen(false);
        setIsRescheduleSlotsModalOpen(true);
    };


    const handleRescheduleOk = async () => {
        try {
            const values = await form.validateFields();
            const ranges: [string, string][] = values.slots.map(
                (r: [dayjs.Dayjs, dayjs.Dayjs]) => [r[0].toISOString(), r[1].toISOString()]
            );

            // —— 直接调用 reschedule 接口 ——
            await fetch('/api/appointment/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: currentAppt!.id,
                    proposed_time_ranges: ranges,
                    proposer: mentorId,
                    receiver: currentAppt!.otherUser.id,
                    // reason: rescheduleComment,
                }),
            });

            message.success('Reschedule request sent!');
            form.resetFields();
            setIsRescheduleSlotsModalOpen(false);
            fetchAppointments();
        } catch (err: any) {
            message.error(err.message || 'Submission failed');
        }

    };

    const handleCancelOk = async () => {
        if (!currentAppt) return;
        try {
            await fetch('/api/appointment/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: currentAppt.id,
                    status: 'canceled',
                    cancel_reason: cancelReason,    // <- 这里带上 cancel_reason
                }),
            });
            message.success('Session canceled');
            // 本地更新状态
            setAppointments(list =>
                list.map(a =>
                    a.id === currentAppt.id ? { ...a, status: 'canceled' } : a
                )
            );
        } catch (err: any) {
            message.error(err.message || 'Cancel failed');
        } finally {
            setIsCancelOpen(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setAppointments(list =>
                list.map(appt => {
                    if (appt.status === 'confirmed') {
                        // 拆出结束时间
                        const [, endStr] = appt.time.split(' - ')
                        const endMoment = dayjs(`${appt.date} ${endStr}`, 'YYYY-MM-DD HH:mm')
                        // 如果现在已经超过结束时间 1 分钟
                        if (dayjs().isAfter(endMoment.add(1, 'minute'))) {
                            // 1) 本地更新状态
                            // 2) （可选）同步到后端
                            fetch('/api/appointment/update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    appointment_id: appt.id,
                                    status:         'completed'
                                }),
                            }).catch(() => {/* 忽略网络错误 */})
                            return { ...appt, status: 'completed' }
                        }
                    }
                    return appt
                })
            )
        }, 60_000) // 每分钟执行一次

        return () => clearInterval(timer)
    }, [])

    const showReportModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        setReportReason('');
        setIsReportOpen(true);
    };




    return (
        <div style={{ padding: 16 }}>
            {/*<Title level={3}>My Sessions</Title>*/}

            {/* —— 三个分类标签页 —— */}
            <Tabs
                activeKey={filter}
                onChange={key => setFilter(key as FilterKey)}
                items={[
                    { key: 'upcoming',   label: 'Upcoming'   },
                    { key: 'past',       label: 'Past'       },
                    { key: 'cancelled',  label: 'Cancelled'  },
                ]}
            />

            {loading ? (
                <Spin size="large" />
            ) : filteredAppointments.length === 0 ? (
                <Empty description="No sessions found." />
            ) : (
                [...filteredAppointments]
                    .sort((a, b) => {
                        const aStart = dayjs(`${a.date} ${a.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm');
                        const bStart = dayjs(`${b.date} ${b.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm');
                        return aStart.diff(bStart); // 时间近的排前面
                    })
                    .map(appt => (
                    <Card
                        key={appt.id}
                        style={{ marginBottom: 16 }}
                        title={
                            <Space align="center" style={{ position: 'relative', width: '100%' }}>
                                <CalendarOutlined />
                                <Text strong>{appt.date}</Text>
                                <ClockCircleOutlined style={{ marginLeft: 16 }} />
                                <Text strong>{appt.time} {getShortTimeZone()}</Text>

                                {appt.status !== 'canceled' && (
                                    appt.proposal?.status === 'pending' ? (
                                        <Text
                                            style={{
                                                marginLeft: 54,
                                                fontWeight: 700,
                                                fontSize: 16,
                                                lineHeight: '24px',
                                                color: '#1890FF',
                                            }}
                                        >
                                            Waiting for Confirmation
                                        </Text>
                                    ) : (() => {
                                        const start = dayjs(
                                            `${appt.date} ${appt.time.split(' - ')[0]}`,
                                            'YYYY-MM-DD HH:mm'
                                        );
                                        const now = dayjs();
                                        const diffInHours = start.diff(now, 'hour');
                                        // 如果小于等于 0，就不显示任何东西
                                        if (diffInHours <= 0) {
                                            return null;
                                        }
                                        // 小于 24 小时
                                        if (diffInHours < 24) {
                                            return (
                                                <Text
                                                    style={{
                                                        marginLeft: 54,
                                                        fontWeight: 700,
                                                        fontSize: 16,
                                                        lineHeight: '24px',
                                                        color: '#1890FF',
                                                    }}
                                                >
                                                    In {diffInHours} Hours
                                                </Text>
                                            );
                                        }
                                        // >= 24 小时
                                        const diffInDays = start.diff(now, 'day');
                                        const hoursAfterDays = start.diff(now.add(diffInDays, 'day'), 'hour');
                                        return (
                                            <Text
                                                style={{
                                                    marginLeft: 54,
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    lineHeight: '24px',
                                                    color: '#1890FF',
                                                }}
                                            >
                                                In {diffInDays} Days {hoursAfterDays} Hours
                                            </Text>
                                        );
                                    })()
                                )}

                                <Tag
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 2,
                                        background: appt.status === 'canceled' ? '#FFF1F0' : '#E6F7FF',
                                        border: appt.status === 'canceled'
                                            ? '1px dashed #FFA39E'
                                            : '1px dashed #91D5FF',
                                        borderRadius: 2,
                                        fontWeight: 400,
                                        fontSize: 12,
                                        lineHeight: '20px',
                                        color: appt.status === 'canceled' ? '#FF4D4F' : '#1890FF',
                                    }}
                                >
                                    {appt.status === 'confirmed'
                                        ? 'Upcoming'
                                        : appt.status === 'reschedule_in_progress'
                                            ? 'Reschedule In Progress'
                                            : appt.status}
                                </Tag>
                            </Space>
                        }
                        actions={
                            filter === 'past'
                                // Past 分页只显示 Report Issue
                                ? [
                                    <div
                                        key="report-issue"
                                        onClick={() => showReportModal(appt)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <FrownOutlined style={{ fontSize: 18 }} />
                                        <div>Report Issue</div>
                                    </div>
                                ]
                                // 非 past：走你原来的逻辑
                                : (
                                    (appt.status !== 'canceled' && (appt.proposal?.status === 'pending' || appt.status === 'paid'))
                                        ? [
                                            <Button
                                                key="review"
                                                type="primary"
                                                style={{ width: '100%' }}
                                                onClick={() => {
                                                    if (appt.status === 'paid') {
                                                        setConfirmAppt(appt);
                                                        setIsConfirmOpen(true);
                                                    } else {
                                                        setReviewAppt(appt);
                                                        setIsReviewOpen(true);
                                                    }
                                                }}
                                            >
                                                <BellOutlined style={{ marginRight: 8 }} />
                                                Review and Confirm the Session Request
                                            </Button>
                                        ]
                                        : (
                                            appt.status === 'canceled' || appt.status === 'noshow'
                                                ? []
                                                : [
                                                    <div key="reschedule" onClick={() => showRescheduleModal(appt)} style={{ cursor: 'pointer' }}>
                                                        <CalendarTwoTone style={{ fontSize: 18 }} /><div>Reschedule</div>
                                                    </div>,
                                                    <div key="cancel" onClick={() => showCancelModal(appt)} style={{ cursor: 'pointer' }}>
                                                        <CloseCircleOutlined style={{ fontSize: 18 }} /><div>Cancel</div>
                                                    </div>,
                                                    <div key="noshow" onClick={() => showReportModal(appt)} style={{ cursor: 'pointer' }}>
                                                        <FrownOutlined style={{ fontSize: 18 }} /><div>Report Issue</div>
                                                    </div>,
                                                    <div key="join" onClick={() => {/*…*/}} style={{ cursor: 'pointer' }}>
                                                        <BellOutlined style={{ fontSize: 18 }} /><div>Join</div>
                                                    </div>,
                                                ]
                                        )
                                )
                        }
                    >
                        {/* —— 移除：原先 inline pending 区块 —— */}

                        <Space>
                            <Avatar>{appt.otherUser.username.charAt(0)}</Avatar>
                            <Text strong>{appt.otherUser.username}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({appt.service_type})
                            </Text>
                        </Space>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Notes:</Text>
                            <p>{appt.description}</p>
                        </div>
                        {appt.resume_url && (() => {
                            // 1. 先取出最后一段 "1752650411087-jakes-resume.pdf"
                            const fullName = appt.resume_url.split('/').pop() || '';
                            // 2. 再去掉前面的时间戳部分，只保留 “jakes-resume.pdf”
                            const displayName = fullName.includes('-')
                                ? fullName.split('-').slice(1).join('-')
                                : fullName;
                            return (
                                <a
                                    href={appt.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        marginTop: 8,
                                        color: '#1890FF',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <FileOutlined style={{ fontSize: 18, marginRight: 8 }} />
                                    <span style={{ textDecoration: 'underline' }}>
        {displayName}
      </span>
                                </a>
                            );
                        })()}
                    </Card>
                ))
            )}

            <Modal
                title="Confirming Your Session"
                visible={isConfirmOpen}
                onCancel={() => setIsConfirmOpen(false)}
                footer={[
                    <Button key="cancel" danger onClick={() => {
                        // TODO: 调用取消的接口
                        setIsConfirmOpen(false);
                        if (confirmAppt) setCurrentAppt(confirmAppt);
                        setIsCancelOpen(true);

                    }}>
                        Cancel Session
                    </Button>,
                    <Button key="reschedule" onClick={() => {
                        // 先关掉确认框，再打开重排框
                        setIsConfirmOpen(false);
                        if (confirmAppt) {
                            setCurrentAppt(confirmAppt);
                            setIsRescheduleReasonModalOpen(true);
                        }
                    }}>
                        Reschedule Session
                    </Button>,
                    <Button key="confirm" type="primary" onClick={() => {
                        if (confirmAppt) {
                            handleConfirmCurrentTime(confirmAppt);
                        }
                        setIsConfirmOpen(false);
                    }}>
                        Confirm the Session
                    </Button>
                ]}
            >
                {/* Session Time */}
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Session Time:</Text>{' '}
                    <Text style={{ fontWeight: 400, color: '#000' }}>
                        {confirmAppt?.date} {confirmAppt?.time} {getShortTimeZone()}
                    </Text>
                </div>

                {/* Mentee */}
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                    <Text strong style={{ marginRight: 8 }}>Mentee:</Text>
                    <Avatar size="small" style={{ marginRight: 4 }}>
                        {confirmAppt?.otherUser.username.charAt(0)}
                    </Avatar>
                    <Text style={{ fontWeight: 400, color: '#000' }}>
                        {confirmAppt?.otherUser.username}
                    </Text>
                </div>

                {/* Support for */}
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                    <Text strong style={{ marginRight: 8 }}>Support for:</Text>
                    <Text style={{ fontWeight: 400, color: '#000' }}>
                        {'Service name Placeholder'}
                    </Text>
                </div>
            </Modal>
            <Modal
                title="Reschedule Your Session"
                open={isRescheduleReasonModalOpen}
                onCancel={() => setIsRescheduleReasonModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsRescheduleReasonModalOpen(false)}>
                        Back
                    </Button>,
                    <Button
                        key="next"
                        type="primary"
                        onClick={handleRescheduleReasonNext}
                        disabled={!rescheduleComment.trim()}
                    >
                        Next
                    </Button>,
                ]}
            >
                <Text>Let your mentee know why you’re rescheduling.</Text>
                <Input.TextArea
                    rows={4}
                    value={rescheduleComment}
                    onChange={e => setRescheduleComment(e.target.value)}
                    placeholder="Briefly explain why you’re rescheduling..."
                    style={{ marginTop: 12 }}
                />
            </Modal>
            <Modal
                title="Reschedule Your Session"
                visible={isReviewOpen}
                onCancel={() => setIsReviewOpen(false)}
                footer={[
                    <Button
                        key="cancel"
                        danger
                        onClick={() => {
                            setIsReviewOpen(false);
                            if (reviewAppt) showCancelModal(reviewAppt);
                        }}
                    >
                        Cancel the Session
                    </Button>,
                    (selectedProposal[reviewAppt?.id ?? ''] === (reviewAppt?.proposal?.proposed_time_ranges.length ?? 0))
                        ? (
                            <Button
                                key="propose"
                                type="primary"
                                onClick={() => {
                                    // 先关闭当前 “Review” 弹窗，再打开重排时段的弹窗
                                    setIsReviewOpen(false);
                                    setCurrentAppt(reviewAppt);
                                    setRescheduleComment('');
                                    setIsRescheduleReasonModalOpen(true);
                                }}
                            >
                                Propose More Time
                            </Button>
                        )
                        : (
                            <Button
                                key="confirm"
                                type="primary"
                                onClick={() => {
                                    if (reviewAppt?.proposal) {
                                        handleAccept(reviewAppt.proposal);
                                    }
                                    setIsReviewOpen(false);
                                }}
                            >
                                Confirm the New Time
                            </Button>
                        )
                ]}
            >
                {/* Reschedule Notes */}
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Reschedule Notes</Text>
                <Text
                    style={{
                        display: 'block',
                        padding: '8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        marginBottom: 24,
                    }}
                >
                    Sorry for the change — something urgent came up at work. I've proposed new times that I hope will work for you.
                </Text>

                {/* Proposed New Time Slots */}
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Proposed New Time Slots</Text>
                <Radio.Group
                    onChange={e => {
                        if (reviewAppt?.id) {
                            setSelectedProposal({ [reviewAppt.id]: e.target.value });
                        }
                    }}
                    value={selectedProposal[reviewAppt?.id ?? '']}
                    disabled={!reviewAppt}
                    style={{ display: 'block', marginBottom: 16 }}
                >
                    {/* 原始时间，划线显示 */}
                    <Text style={{ display: 'inline-block', marginRight: 8, color: '#1890FF' }}>
                        Original Time:
                    </Text>
                    <Text
                        delete
                        style={{
                            display: 'inline-block',
                            marginBottom: 8,
                            color: 'rgba(0,0,0,0.45)', // 灰色
                            fontSize: 14,
                            lineHeight: '22px',
                        }}
                    >
                        {reviewAppt?.date} {reviewAppt?.time} {getShortTimeZone()}
                    </Text>

                    {/* 可选的新时间段 */}
                    {reviewAppt?.proposal?.proposed_time_ranges.map((range, idx) => (
                        <Radio key={idx} value={idx} style={{ display: 'block', margin: '8px 0' }}>
                            <Space>
                                {/*<BellOutlined />*/}
                                <Text>
                                    {dayjs(range[0]).format('MM/DD dddd h:mmA')} –{' '}
                                    {dayjs(range[1]).format('h:mmA')} {getShortTimeZone()}
                                </Text>
                            </Space>
                        </Radio>
                    ))}

                    {/* 最后一个“更多选项” */}
                    <Radio
                        value={reviewAppt?.proposal?.proposed_time_ranges.length}
                        style={{ display: 'block', margin: '8px 0' }}
                    >
                        <Space>
                            {/*<BellOutlined />*/}
                            <Text>No suitable time, ask mentor to propose more options.</Text>
                        </Space>
                    </Radio>
                </Radio.Group>
            </Modal>
            <Modal
                title="Reschedule Your Session"
                open={isRescheduleSlotsModalOpen}
                onOk={handleRescheduleOk}
                onCancel={() => {
                    form.resetFields();
                    setIsRescheduleSlotsModalOpen(false);
                    setIsRescheduleReasonModalOpen(true);
                }}
                okText="Confirm and Send"
                cancelText="Back"
            >
                <p style={{ marginBottom: 8 }}>
                    Based on your availability, please propose time slots for{' '}
                    <strong>{currentAppt?.otherUser.username}</strong>.
                </p>
                <Form form={form} layout="vertical" name="rescheduleForm">
                    <Form.List name="slots" initialValue={[]}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} align="baseline" style={{ marginBottom: 8 }}>
                                        <Form.Item
                                            {...restField}
                                            name={[name]}
                                            rules={[
                                                { required: true, message: 'Required' },
                                                {
                                                    validator: (_, value: [dayjs.Dayjs, dayjs.Dayjs]) => {
                                                        if (!value || value.length !== 2)
                                                            return Promise.reject('Pick a range');
                                                        const [s, e] = value;
                                                        if (![0,30].includes(s.minute()) || ![0,30].includes(e.minute()))
                                                            return Promise.reject('分钟只能是 0 或 30');
                                                        if (e.diff(s, 'minutes') !== 60)
                                                            return Promise.reject('时长必须为 1 小时');
                                                        return Promise.resolve();
                                                    },
                                                },
                                            ]}
                                        >
                                            <DatePicker.RangePicker
                                                showTime={{
                                                    format: 'HH:mm',
                                                    minuteStep: 30   // 每 30 分钟一个档位，只会出现 00 和 30
                                                }}
                                                format="YYYY-MM-DD HH:mm"
                                                onCalendarChange={(dates) => handleSlotCalendarChange(dates, [name])}
                                                disabledDate={current => current && current < dayjs().startOf('day')}
                                                disabledTime={current => ({
                                                    // 小时不做限制
                                                    disabledMinutes: () => {
                                                        // 允许 0 和 30，其它都禁掉
                                                        return Array.from({ length: 60 }, (_, i) => i).filter(m => m !== 0 && m !== 30);
                                                    },
                                                    disabledSeconds: () =>
                                                        Array.from({ length: 59 }, (_, i) => i + 1),
                                                })}
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
            <Modal
                title="Cancel Your Session"
                open={isCancelOpen}
                onCancel={() => setIsCancelOpen(false)}
                width="90vw"
                centered
                style={{ maxWidth: 560 }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
                footer={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '0 0px 0px',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Back 按钮 */}
                        <Button
                            style={{
                                flex: 1,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FFFFFF',
                                border: '1px solid #D9D9D9',
                                boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.016)',
                                borderRadius: 2,
                            }}
                            onClick={() => setIsCancelOpen(false)}
                        >
                            Back
                        </Button>

                        {/* 调用 handleCancelOk */}
                        <Button
                            style={{
                                flex: 1,
                                height: 32,
                                marginLeft: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FF4D4F',
                                boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.043)',
                                borderRadius: 2,
                            }}
                            type="primary"
                            danger
                            onClick={handleCancelOk}
                        >
                            Cancel Session Anyway
                        </Button>
                    </div>
                }
            >
                {/* 弹窗内容区 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* 提示文字 */}
                    {/*<p*/}
                    {/*    style={{*/}
                    {/*        margin: 0,*/}
                    {/*        fontSize: 14,*/}
                    {/*        lineHeight: '16px',*/}
                    {/*        color: '#FF4D4F',*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    * If you cancel within 48 hours of the session time, a $5 service fee will be deducted from your refund to cover scheduling and processing costs.*/}
                    {/*</p>*/}
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: '16px',
                            color: '#000',
                        }}
                    >
                        Let your mentee know why you’re canceling. Or email{' '}
                        <span style={{ color: '#1890FF', textDecoration: 'underline' }}>
        mentorup.contact@gmail.com
      </span>{' '}
                        to let us know your concerns.
                    </p>
                </div>

                {/* 文本输入区 */}
                <Form.Item
                    name="reason"
                    style={{
                        width: '100%',
                        marginBottom: 0,
                    }}
                >
                    <Input.TextArea
                        placeholder="Briefly explain why you're canceling..."
                        autoSize={{ minRows: 4 }}
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#FFFFFF',
                            border: '1px solid #D9D9D9',
                            borderRadius: 2,
                            padding: '5px 12px',
                            fontSize: 14,
                            lineHeight: '22px',
                            color: cancelReason ? '#000' : 'rgba(0,0,0,0.25)',
                        }}
                    />
                </Form.Item>
            </Modal>


            <Modal
                title="Report Issue"
                open={isReportOpen}
                onCancel={() => setIsReportOpen(false)}
                footer={null}
            >
                <Text>Sorry to hear your session didn’t go well.<br/>
                    You can report the issue to MentorUp using the buttons below.</Text>
                <Input.TextArea
                    rows={4}
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    placeholder="Briefly explain the issue..."
                    style={{ marginTop: 12 }}
                />

                <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
                    {/* 直接打开邮箱，不带正文 */}
                    <Button
                        onClick={() => window.open('mailto:mentorup.contact@gmail.com')}
                    >
                        Email MentorUp
                    </Button>

                    {/* 带主题 & 正文 */}
                    <Button
                        type="primary"
                        disabled={!reportReason.trim()}
                        onClick={() => {
                            const subject = encodeURIComponent(
                                `Issue report for session ${currentAppt?.id}`
                            );
                            const body = encodeURIComponent(reportReason);
                            window.open(
                                `mailto:mentorup.contact@gmail.com?subject=${subject}&body=${body}`
                            );
                        }}
                    >
                        Report an Issue to MentorUp
                    </Button>
                </Space>
            </Modal>
        </div>
    );
}
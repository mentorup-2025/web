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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

import type { Appointment as APIAppointment } from '@/types/appointment'
import type { RescheduleProposal } from '@/types/reschedule_proposal';
import { User } from '@/types';

const { Title, Text } = Typography;

function getShortTimeZone() {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
    const parts = dtf.formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
}

interface UIAppointment extends APIAppointment {
    proposal?: Proposal
    otherUser: { id: string; username: string; avatar_url?: string }
}

interface Proposal {
    id: string;
    appointment_id: string;
    proposed_time_ranges: [string, string][];
    status: 'pending' | 'accepted' | 'declined';
}

// interface Appointment {
//     id: string;
//     date: string;
//     time: string;
//     status: string;
//     description: string;
//     cancel_reason: string;
//     resume_url?: string;
//     service_type: string;
//     otherUser: {
//         id: string;
//         username: string;
//         avatar_url?: string;
//     };
//     proposal?: Proposal;
// }
const bookedSlotsStatePlaceholder: [string, string][] = [];

type FilterKey = 'upcoming' | 'past' | 'cancelled';

export default function MySessionsTab() {
    const params = useParams();
    const menteeId = params?.id as string;

    const [appointments, setAppointments] = useState<UIAppointment[]>([]);
    const [proposals, setProposals] = useState<RescheduleProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [userMap, setUserMap] = useState<Record<string, User>>({});

    const [selectedProposal, setSelectedProposal] = useState<Record<string, number>>({});

    // Reschedule modal state
    const [currentAppt, setCurrentAppt] = useState<UIAppointment | null>(null);
    const [form] = Form.useForm();
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [exForm] = Form.useForm();

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewAppt, setReviewAppt] = useState<UIAppointment | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAppt, setConfirmAppt] = useState<UIAppointment | null>(null);

    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [bookedSlots, setBookedSlots] = useState<[string,string][]>([]);

    const [filter, setFilter] = useState<FilterKey>('upcoming');

    const [isRescheduleReasonModalOpen, setIsRescheduleReasonModalOpen] = useState(false);
    const [rescheduleComment, setRescheduleComment] = useState('');

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isRescheduleSlotsModalOpen, setIsRescheduleSlotsModalOpen] = useState(false);

    // ===== Feedback states =====
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isThanksOpen, setIsThanksOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    type ReviewItem = {
        id: string;
        reviewerId: string;
        rating: number;
        comment?: string;
        createdAt?: string;
    };
    const [revieweeReviews, setRevieweeReviews] = useState<ReviewItem[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [feedbackTarget, setFeedbackTarget] = useState<{ revieweeId: string; apptId: string } | null>(null);

    const EMOJIS = [
        { value: 1, label: '😡' },
        { value: 2, label: '😟' },
        { value: 3, label: '😐' },
        { value: 4, label: '😊' },
        { value: 5, label: '😄' },
    ];

    // 拉取某个被评对象的历史评价
    const fetchReviewsByReviewee = useCallback(async (revieweeId: string) => {
        setReviewsLoading(true);
        try {
            const res = await fetch(
                `/web/app/api/reviews/list_by_reviewee?revieweeId=${encodeURIComponent(revieweeId)}`
            );
            const data = await res.json();
            const list = Array.isArray(data) ? data : data?.data;
            setRevieweeReviews(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('fetch reviews error', err);
            setRevieweeReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    }, []);

    const openWriteComment = (appt: UIAppointment) => {
        // 被评对象选导师；如需评 mentee，改为 appt.mentee_id
        const revieweeId = appt.mentor_id;
        setFeedbackTarget({ revieweeId, apptId: appt.id });
        setFeedbackComment('');
        setIsFeedbackOpen(true);
    };

    const localTz = dayjs.tz.guess();
    const toLocal = (timeStr?: string) => {
        if (!timeStr) return dayjs(); // fallback to now
        // 如果原始能被 dayjs 直接解析，优先用它（再转 tz）
        let d = dayjs(timeStr);
        if (!d.isValid()) {
            // 1. 把 "YYYY-MM-DD HH:mm:ss" 这种中间空格替换成 T（只针对日期时间之间那一段）
            let normalized = timeStr.trim().replace(
                /^(\d{4}-\d{2}-\d{2})[ T]+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/,
                '$1T$2'
            );
            // 2. 如果末尾没有明确 offset 或 Z，就假定是 UTC
            if (!/[Zz]|[+-]\d{2}:\d{2}$/.test(normalized)) {
                normalized += 'Z';
            }
            d = dayjs.utc(normalized);
        }
        return d.tz(localTz);
    };

    const now     = dayjs();
    // 根据 status 来做分类
    const filteredAppointments = appointments.filter(a => {
        if (filter === 'upcoming') {
            return ['confirmed', 'paid', 'reschedule_in_progress'].includes(a.status);
        }
        if (filter === 'past') {
            return a.status === 'completed' || dayjs(a.end_time).isBefore(now);
        }
        // cancelled
        return ['canceled', 'noshow'].includes(a.status);
    });
    // 拉列表
    const fetchAppointments = useCallback(async () => {
        if (!menteeId) return;
        setLoading(true);
        try {
            // 1) 拿所有 appointment
            const apptRes = await fetch('/api/appointment/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: menteeId }),
            });
            const apptJson = await apptRes.json();

            // 防御：如果 data 或 appointments 不是数组，就用空数组
            const rawAppts: any[] = Array.isArray(apptJson.data?.appointments)
                ? apptJson.data.appointments
                : [];

            // 只保留 mentee 自己的
            const menteeOnly = rawAppts.filter(a => a.mentee_id === menteeId);

            // 2) 拿所有 proposals
            const propRes = await fetch(`/api/reschedule_proposal/${menteeId}`);
            const propJson = await propRes.json();
            const allProps: RescheduleProposal[] = Array.isArray(propJson.data)
                ? (propJson.data as RescheduleProposal[])
                : [];
            setProposals(allProps);

            // 3) 预加载 “另一方” 用户信息（这里是导师）
            const otherIds = Array.from(new Set([
                ...menteeOnly.map(a => a.mentor_id),
                menteeId, // 确保把自己也 preload 了
            ]));

            const userMapTemp: Record<string, User> = {};
            await Promise.all(otherIds.map(async id => {
                try {
                    const res = await fetch(`/api/user/${id}`);
                    const json = await res.json();
                    if (json.data) {
                        userMapTemp[id] = json.data as User;
                    }
                } catch (err) {
                    console.error(`Failed to fetch user ${id}:`, err);
                }
            }));
            setUserMap(userMapTemp);

            // 4) 最后把过滤后的 appointments 放到 state
            setAppointments(menteeOnly);

        } catch (e: any) {
            console.error(e);
            message.error(e.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [menteeId]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    // Accept Mentor 的提案
    const handleAccept = async (prop: RescheduleProposal) => {
        const idx = selectedProposal[prop.id];
        if (idx == null) return message.warning('Please select a time slot');
        const [start_time, end_time] = prop.proposed_time[idx];
        try {
            const res = await fetch('/api/appointment/confirm', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ appointment_id: prop.id, start_time, end_time }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            message.success('New time confirmed');
            setAppointments(list => list.map(a => a.id===prop.id
                ? { ...a, status:'confirmed', start_time, end_time }
                : a));
        } catch (err:any) {
            message.error(err.message);
        }
    };

    // 点击 Review 按钮
    const openReview = (appt: UIAppointment) => {
        setReviewAppt(appt);
        setIsReviewOpen(true);
    };
    // 点击 Confirm 按钮
    const openConfirm = (appt: UIAppointment) => {
        setConfirmAppt(appt);
        setIsConfirmOpen(true);
    };
    const handleRescheduleSlotsOk = async () => {
        const values = await form.validateFields();
        const ranges = values.slots.map((r:[dayjs.Dayjs,dayjs.Dayjs]) => [r[0].toISOString(), r[1].toISOString()]);
        await fetch('/api/appointment/reschedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appointment_id: currentAppt!.id,
                proposed_time_ranges: ranges,
                proposer: menteeId,
                receiver: currentAppt!.mentor_id,
                reason: rescheduleComment,
            }),
        });
        message.success('Reschedule request sent!');
        form.resetFields();
        setIsRescheduleSlotsModalOpen(false);
        fetchAppointments();
    };
// 当点击 “Decline” 或 “Reschedule” 按钮时，先打开「说明原因」弹窗
    const handleDecline = (apptId: string) => {
        const appt = appointments.find(a => a.id === apptId)!;
        setCurrentAppt(appt);
        setRescheduleComment('');
        setIsRescheduleReasonModalOpen(true);
    };

// 统一入口：打开「说明原因」弹窗
    const showRescheduleReasonModal = (appt: UIAppointment) => {
        setCurrentAppt(appt);
        setRescheduleComment('');
        setIsRescheduleReasonModalOpen(true);
    };

// 下一步：关闭原因弹窗，打开「选时间段」弹窗
    const handleRescheduleReasonNext = () => {
        setIsRescheduleReasonModalOpen(false);
        setIsRescheduleSlotsModalOpen(true);
    };

// 取消时打开「取消会话」弹窗
    const showCancelModal = (appt: UIAppointment) => {
        setCurrentAppt(appt);
        setCancelReason('');
        setIsCancelOpen(true);
    };
    const showReportModal = (appt: UIAppointment) => {
        setCurrentAppt(appt);
        setReportReason('');
        setIsReportOpen(true);
    };
    // Reschedule 提交
    const handleRescheduleOk = async () => {
        try {
            const vals = await form.validateFields();
            const ranges: [string,string][] = vals.slots.map((r:[dayjs.Dayjs,dayjs.Dayjs])=>[r[0].toISOString(),r[1].toISOString()]);
            await fetch('/api/appointment/reschedule',{ method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    appointment_id: currentAppt!.id,
                    proposed_time_ranges: ranges,
                    proposer: menteeId,
                    receiver: currentAppt!.mentor_id,
                    reason: rescheduleComment,
                }),
            });
            message.success('Reschedule request sent!');
            form.resetFields();
            setIsRescheduleOpen(false);
            fetchAppointments();
        } catch (err:any) {
            message.error(err.message||'提交失败');
        }
    };

    const handleCancelOk = async () => {
        if (!currentAppt) return;
        try {
            const res = await fetch('/api/appointment/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: currentAppt.id,
                    status: 'canceled',
                    cancel_reason: cancelReason,    // 注意这里用 cancel_reason
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cancel failed');
            message.success('Session canceled');
            // 本地更新状态
            setAppointments(list =>
                list.map(a =>
                    a.id === currentAppt.id ? { ...a, status: 'canceled' } : a
                )
            );
        } catch (err: any) {
            console.error(err);
            message.error(err.message || 'Cancel failed');
        } finally {
            setIsCancelOpen(false);
        }
    };
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
                const bsDay = toLocal(bs);
                const beDay = toLocal(be);
                return start.isBefore(beDay) && autoEnd.isAfter(bsDay);
            });
            if (conflict) {
                message.warning('⚠️ This time slot conflicts with an existing session, please choose again.');
            }
        }
    };

    // Add simple join functionality using existing appointment data
    const handleJoinClick = (appt: UIAppointment) => {
        if (appt.link) {
            // Open the meet link in a new window/tab
            window.open(appt.link, '_blank', 'noopener,noreferrer');
        } else {
            alert('No meeting link available yet. Please wait for the session to be confirmed.');
        }
    };

    return (
        <div style={{ padding:16 }}>
            {/*<Title level={3}>My Sessions</Title>*/}
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
                        const aStart = toLocal(a.start_time);
                        const bStart = toLocal(b.start_time);
                        return aStart.diff(bStart);
                    })
                    .map(appt => {
                        const start = toLocal(appt.start_time);
                        const end = toLocal(appt.end_time);
                        const date = start.format('YYYY-MM-DD');
                        const time = `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
                        const proposal = proposals.find(p => p.id === appt.id);
                        const otherUserId = appt.mentor_id === menteeId ? appt.mentee_id : appt.mentor_id;
                        const otherUser = userMap[otherUserId];
                        // Always use mentee's resume for the appointment
                        const menteeResumeUrl = userMap[appt.mentee_id]?.resume;
                        return (
                            <Card
                                key={appt.id}
                                style={{ marginBottom:16 }}
                                title={
                                    <Space align="center" style={{ position:'relative', width:1056, height:28 }}>
                                        <CalendarOutlined/>
                                        <Text style={{ fontWeight:700, fontSize:16, lineHeight:'24px' }}>{date}</Text>
                                        <ClockCircleOutlined style={{ marginLeft:16 }}/>
                                        <Text style={{ fontWeight:700, fontSize:16, lineHeight:'24px' }}>
                                            {time} {getShortTimeZone()}
                                        </Text>
                                        {appt.status==='canceled' ? null
                                            : proposal
                                                ? <Text style={{ marginLeft:54,fontWeight:700,fontSize:16,color:'#1890FF' }}>
                                                    Waiting for Confirmation
                                                </Text>
                                                : <Text style={{ marginLeft:54,fontWeight:700,fontSize:16,color:'#1890FF' }}>
                                                    {(() => {
                                                        const start = toLocal(appt.start_time);
                                                        const now = dayjs(); // 本地时间
                                                        const diffInHours = start.diff(now, 'hour');
                                                        const diffInDays = start.diff(now, 'day');
                                                        if (diffInHours <= 0) {
                                                            return null;
                                                        }
                                                        if (diffInHours < 24) {
                                                            return `In ${diffInHours} Hours`;
                                                        } else {
                                                            const hours = start.diff(now.add(diffInDays, 'day'), 'hour');
                                                            return `In ${diffInDays} Days ${hours} Hours`;
                                                        }
                                                    })()}
                                                </Text>
                                        }
                                        <Tag
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 2,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '1px 8px',
                                                gap: 10,
                                                background: appt.status === 'canceled' ? '#FFF1F0' : '#E6F7FF',
                                                border: appt.status === 'canceled'
                                                    ? '1px solid #FFA39E'
                                                    : '1px solid #91D5FF',
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
                                                key="write-comment"
                                                onClick={() => openWriteComment(appt)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <BellOutlined style={{ fontSize: 18 }} />
                                                <div>Write a comment</div>
                                            </div>,
                                            <div
                                                key="report-issue"
                                                onClick={() => showReportModal(appt)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <FrownOutlined style={{ fontSize: 18 }} />
                                                <div>Report Issue</div>
                                            </div>,
                                        ]
                                        // 非 past：走你原来的逻辑
                                        : !!proposal   // ← 这里替换原先的 `proposal`
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
                                                        <div
                                                            key="reschedule"
                                                            onClick={() => {
                                                                if (appt.service_type === 'Free Coffee Chat (15 Mins)') {
                                                                    return; // 禁用状态，不响应
                                                                }
                                                                showRescheduleReasonModal(appt);
                                                            }}
                                                            style={{
                                                                cursor: appt.service_type === 'Free Coffee Chat (15 Mins)' ? 'not-allowed' : 'pointer',
                                                                opacity: appt.service_type === 'Free Coffee Chat (15 Mins)' ? 0.5 : 1,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <CalendarTwoTone style={{ fontSize: 18 }} />
                                                            <div>Reschedule</div>
                                                        </div>,
                                                        <div key="cancel" onClick={() => showCancelModal(appt)} style={{ cursor: 'pointer' }}>
                                                            <CloseCircleOutlined style={{ fontSize: 18 }} /><div>Cancel</div>
                                                        </div>,
                                                        <div key="noshow" onClick={() => showReportModal(appt)} style={{ cursor: 'pointer' }}>
                                                            <FrownOutlined style={{ fontSize: 18 }} /><div>Report Issue</div>
                                                        </div>,
                                                        <div key="join" onClick={() => handleJoinClick(appt)} style={{ cursor: 'pointer' }}>
                                                            <BellOutlined style={{ fontSize: 18 }} /><div>Join</div>
                                                        </div>,
                                                    ])

                                }
                            >
                                <Space>
                                    <Avatar>{otherUser?.username?.[0]}</Avatar>
                                    <Text strong>{otherUser?.username}</Text>
                                    <Text type="secondary" style={{ marginLeft: 8 }}>
                                        ({appt.service_type})
                                    </Text>
                                </Space>
                                {menteeResumeUrl && (() => {
                                    const fullName = menteeResumeUrl.split('/').pop() || '';
                                    const displayName = fullName.includes('-')
                                        ? fullName.split('-').slice(1).join('-')
                                        : fullName;
                                    return (
                                        <a
                                            href={menteeResumeUrl}
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
                        );
                    })
            )}

            {/* Confirm Modal */}
            <Modal
                title="Confirming Your Session"
                visible={isConfirmOpen}
                onCancel={()=>setIsConfirmOpen(false)}
                footer={[
                    <Button key="cancel" danger onClick={() => {
                        setIsConfirmOpen(false);
                        if (confirmAppt) {
                            setCurrentAppt(confirmAppt);
                            setIsCancelOpen(true);
                        }
                    }}>
                        Cancel Session
                    </Button>,
                    <Button key="reschedule" onClick={()=>{
                        setIsConfirmOpen(false);
                        if (confirmAppt) showRescheduleReasonModal(confirmAppt);
                    }}>Reschedule Session</Button>,
                    <Button key="confirm" type="primary" onClick={()=>{
                        const proposal = proposals.find(p => p.id === confirmAppt?.id);
                        if (confirmAppt && proposal) handleAccept(proposal);
                        setIsConfirmOpen(false);
                    }}>Confirm the Session</Button>,
                ]}
            >
                <div style={{ marginBottom:16 }}>
                    <Text strong>Session Time:</Text>{' '}
                    <Text style={{ fontWeight:400 }}>
                        {confirmAppt && `${toLocal(confirmAppt.start_time).format('YYYY-MM-DD HH:mm')} – ${toLocal(confirmAppt.end_time).format('HH:mm')} ${getShortTimeZone()}`}
                    </Text>
                </div>
                <div style={{ marginBottom:12, display:'flex',alignItems:'center' }}>
                    <Text strong style={{ marginRight:8 }}>Mentor:</Text>
                    {confirmAppt && (() => {
                        const otherUserId = confirmAppt.mentor_id === menteeId ? confirmAppt.mentee_id : confirmAppt.mentor_id;
                        const otherUser = userMap[otherUserId];
                        return <>
                            <Avatar size="small" style={{ marginRight:4 }}>{otherUser?.username?.[0]}</Avatar>
                            <Text>{otherUser?.username}</Text>
                        </>;
                    })()}
                </div>
            </Modal>

            {/* Review Modal */}
            <Modal
                title="Reschedule Your Session"
                visible={isReviewOpen}
                onCancel={()=>setIsReviewOpen(false)}
                footer={[
                    <Button key="cancel" danger onClick={()=>{
                        setIsReviewOpen(false);
                        if (reviewAppt) showCancelModal(reviewAppt);
                    }}>Cancel the Session</Button>,
                    (() => {
                        const proposal = proposals.find(p => p.id === reviewAppt?.id);
                        return (selectedProposal[reviewAppt?.id||''] === (proposal?.proposed_time.length||0))
                            ? <Button key="propose" type="primary" onClick={()=>{
                                setIsReviewOpen(false);
                                if (reviewAppt) showRescheduleReasonModal(reviewAppt);
                            }}>Propose More Time</Button>
                            : <Button key="confirm" type="primary" onClick={()=>{
                                if (proposal) handleAccept(proposal);
                                setIsReviewOpen(false);
                            }}>Confirm the New Time</Button>
                    })()
                ]}
            >
                <Text strong style={{ display:'block', marginBottom:8 }}>Reschedule Notes</Text>
                <Text style={{ display:'block', padding:8, border:'1px solid #d9d9d9', borderRadius:4, marginBottom:24 }}>
                    Sorry for the change — something urgent came up. Please pick another time.
                </Text>
                <Text strong style={{ display:'block', marginBottom:8 }}>Proposed New Time Slots</Text>
                <Radio.Group
                    onChange={e=>setSelectedProposal({ [reviewAppt!.id]: e.target.value })}
                    value={selectedProposal[reviewAppt?.id||'']}
                    style={{ display:'block', marginBottom:16 }}
                >
                    <Text style={{ marginRight:8, color:'#1890FF' }}>Original Time:</Text>
                    <Text delete style={{ color:'rgba(0,0,0,0.45)', fontSize:14, lineHeight:'22px' }}>
                        {reviewAppt && `${toLocal(reviewAppt.start_time).format('YYYY-MM-DD HH:mm')} - ${toLocal(reviewAppt.end_time).format('HH:mm')} ${getShortTimeZone()}`}
                    </Text>
                    {proposals
                        .find(p => p.id === reviewAppt?.id)
                        ?.proposed_time.map((range, idx) => {
                            const s = toLocal(range[0]);
                            const e = toLocal(range[1]);
                            return (
                                <Radio key={idx} value={idx} style={{ display: 'block', margin: '8px 0' }}>
                                    <Space>
                                        <Text>
                                            {s.format('MM/DD dddd h:mmA')} – {e.format('h:mmA')} {getShortTimeZone()}
                                        </Text>
                                    </Space>
                                </Radio>
                            );
                        })}
                    <Radio value={(() => {
                        const proposal = proposals.find(p => p.id === reviewAppt?.id);
                        return proposal?.proposed_time.length || 0;
                    })()} style={{ display:'block', margin:'8px 0' }}>
                        <Text>No suitable time, ask mentor to propose more options.</Text>
                    </Radio>
                </Radio.Group>
            </Modal>

            {/* Reschedule Modal */}
            <Modal
                title="Reschedule Your Session"
                visible={isRescheduleOpen}
                onOk={handleRescheduleOk}
                onCancel={()=>{ form.resetFields(); setIsRescheduleOpen(false); }}
                okText="Confirm and Send"
                cancelText="Back"
            >
                <p style={{ marginBottom:8 }}>
                    Based on your availability, please propose 3–5 one-hour time slots for <strong>Mentor:</strong> <u>{currentAppt && (() => {
                    const otherUserId = currentAppt.mentor_id === menteeId ? currentAppt.mentee_id : currentAppt.mentor_id;
                    const otherUser = userMap[otherUserId];
                    return otherUser?.username;
                })()}</u>
                </p>
                <Form form={form} layout="vertical" name="rescheduleForm">
                    <Form.List name="slots" initialValue={[]}>
                        {(fields,{ add, remove })=>(
                            <>
                                {fields.map(({ key, name, ...restField })=>(
                                    <Space key={key} align="baseline" style={{ display:'flex', marginBottom:8 }}>
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
                                        <MinusCircleOutlined onClick={()=>remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={()=>add()} icon={<PlusOutlined/>} disabled={fields.length>=5}>
                                        Add time slot
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* Cancel Modal */}
            <Modal
                title="Cancel Your Session"
                visible={isCancelOpen}
                onCancel={()=>setIsCancelOpen(false)}
                centered
                width="90vw"
                style={{ maxWidth:560 }}
                bodyStyle={{ padding:0, display:'flex', flexDirection:'column', gap:12 }}
                footer={
                    <div style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'0 12px', boxSizing:'border-box' }}>
                        <Button
                            style={{
                                flex:1, height:32, background:'#fff', border:'1px solid #D9D9D9',
                                borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center',
                            }}
                            onClick={()=>setIsCancelOpen(false)}
                        >Back</Button>
                        <Button
                            style={{
                                flex:1, marginLeft:16, height:32, background:'#FF4D4F',
                                borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center',
                            }}
                            type="primary" danger
                            onClick={handleCancelOk}
                        >Cancel Session Anyway</Button>
                    </div>
                }
            >
                <p style={{ margin:0, fontSize:14, lineHeight:'16px', color:'#FF4D4F' }}>
                    * If you cancel within 48 hours of the session time, a $5 service fee will be deducted...
                </p>
                <p style={{ margin:0, fontSize:14, lineHeight:'16px', color:'#000' }}>
                    Let your mentor know why you’re canceling. Or email{' '}
                    <span style={{ color:'#1890FF', textDecoration:'underline' }}>
            mentorup.contact@gmail.com
          </span>{' '}
                    to let us know your concerns.
                </p>
                <Form.Item name="reason" style={{ width:'100%', marginBottom:0 }}>
                    <Input.TextArea
                        placeholder="Briefly explain why you're canceling..."
                        autoSize={{ minRows:4 }}
                        value={cancelReason}
                        onChange={e=>setCancelReason(e.target.value)}
                        style={{
                            width:'100%', background:'#fff', border:'1px solid #D9D9D9',
                            borderRadius:2, padding:'5px 12px', fontSize:14, lineHeight:'22px',
                            color: cancelReason ? '#000' : 'rgba(0,0,0,0.25)',
                        }}
                    />
                </Form.Item>
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
                        onClick={() => {
                            setIsRescheduleReasonModalOpen(false)
                            setIsRescheduleOpen(true)  // 或者打开下一个 slots Modal
                        }}
                        disabled={!explanation.trim()}
                    >
                        Next
                    </Button>,
                ]}
            >
                <Text>Let your mentee know why you’re rescheduling.</Text>
                <Input.TextArea
                    rows={4}
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    placeholder="Briefly explain why you’re rescheduling..."
                    style={{ marginTop: 12 }}
                />
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
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/appointment/report_issue', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        appointmentId: currentAppt?.id,
                                        issueDescription: reportReason,
                                    })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Report failed');
                                message.success('Issue reported successfully!');
                                setIsReportOpen(false);
                            } catch (err: any) {
                                console.error('report error', err);
                                message.error(err.message || 'Failed to report issue');
                            }
                        }}
                    >
                        Report an Issue to MentorUp
                    </Button>
                </Space>
            </Modal>
            {/* Feedback (Write a comment) Modal */}
            <Modal
                title="Share Your Feedback"
                open={isFeedbackOpen}
                onCancel={() => setIsFeedbackOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsFeedbackOpen(false)}>Back</Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={feedbackLoading}
                        disabled={!feedbackComment.trim()}
                        onClick={async () => {
                            if (!feedbackTarget) return;
                            try {
                                setFeedbackLoading(true);
                                const res = await fetch('/api/reviews/insert', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        reviewee: feedbackTarget.revieweeId,
                                        reviewer: menteeId,
                                        content: feedbackComment.trim(),
                                    }),
                                });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) throw new Error(data?.message || 'Submit failed');

                                setIsFeedbackOpen(false);
                                setIsThanksOpen(true);
                                setFeedbackComment('');
                            } catch (e:any) {
                                message.error(e?.message || 'Failed to submit review');
                            } finally {
                                setFeedbackLoading(false);
                            }
                        }}
                    >
                        Submit
                    </Button>
                ]}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>1. How satisfied are you with this mentorship session?</Text>
                    <div style={{ marginTop: 12 }}>
                        <Radio.Group
                            value={feedbackRating ?? undefined}
                            onChange={(e) => setFeedbackRating(e.target.value)}
                        >
                            <Space size="large">
                                {EMOJIS.map(e => (
                                    <Radio key={e.value} value={e.value} aria-label={`rating-${e.value}`}>
                                        <span style={{ fontSize: 24, lineHeight: 1 }}>{e.label}</span>
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    <Text strong>2. Please add a review for your session.</Text>
                </div>
                <Input.TextArea
                    placeholder="Share any feedback about your mentor or the session experience..."
                    autoSize={{ minRows: 4 }}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                />


            </Modal>
            {/* Thank you Modal */}
            <Modal
                open={isThanksOpen}
                footer={[
                    <Button key="back" onClick={() => setIsThanksOpen(false)}>Back to My Session</Button>,
                    <Button
                        key="check"
                        type="primary"
                        onClick={() => {
                            setIsThanksOpen(false);
                            // 这里可以跳转到“我的评论”页，或刷新当前
                            // router.push('/my/reviews') 之类；此处简单刷新
                            // fetchAppointments();
                        }}
                    >
                        Check my review
                    </Button>
                ]}
                onCancel={() => setIsThanksOpen(false)}
            >
                <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <Title level={4} style={{ marginBottom: 0 }}>Thank you for your feedback!</Title>
                </div>
            </Modal>
        </div>
    );
}
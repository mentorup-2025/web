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
    Tabs,
    Tooltip
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
import customParseFormat from 'dayjs/plugin/customParseFormat';
import styles from './MySessionsTab.module.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
// At the top of the component or in a suitable location
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
    startTime: string;
    endTime:   string;
    status: string;
    description: string;
    cancel_reason: string;
    resume_url?: string;
    service_type: string;
    otherUser: {
        id: string;
        username: string;
        avatar_url?: string;
        profile_url?: string;
        resume?: string;
    };
    proposal?: Proposal;
    link?: string; // Added for meeting link
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

    const localTz = dayjs.tz.guess();

    // 定义兼容 iOS 的 dayjs 包装
    const _dayjs = (date?: string | Date, c?: any) => {
        if (typeof date === 'string') {
            date = date.replace(/-/g, '/');  // iOS 兼容
        }
        return dayjs(date, c);
    };

// 统一可接受的输入格式（按常见后端/数据库输出排列）
    const KNOWN_FORMATS = [
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DD HH:mm:ss',
        'YYYY-MM-DDTHH:mm',
        'YYYY-MM-DDTHH:mm:ss',
        'YYYY/MM/DD HH:mm',
        'YYYY/MM/DD HH:mm:ss',
        // 带毫秒
        'YYYY-MM-DD HH:mm:ss.SSS',
        'YYYY-MM-DDTHH:mm:ss.SSS',
        'YYYY/MM/DD HH:mm:ss.SSS',
    ];

// 判断是否已带时区（Z 或 ±hh:mm）
    const hasTZ = (s: string) => /[Zz]|[+-]\d{2}:\d{2}$/.test(s);

// 解析到“有时区的 dayjs 实例”，再转到本地时区显示
    function toLocal(input?: string | Date) {
        const localTz = dayjs.tz.guess();

        if (!input) return dayjs('');

        if (input instanceof Date) {
            return dayjs(input).tz(localTz);
        }

        let raw = String(input).trim();

        // iOS 兼容：仅在“无时区且非 ISO T”时做 -/-> / 替换
        if (!hasTZ(raw) && raw.includes('-') && !raw.includes('T')) {
            raw = raw.replace(/-/g, '/');
        }

        const isoish = raw.replace(' ', 'T');

        // 1) 明确带时区：按原时区读，再转本地
        if (hasTZ(raw)) {
            const d = dayjs(isoish);
            return d.isValid() ? d.tz(localTz) : dayjs('');
        }

        // 2) 有 'T' 但无时区：按 UTC 解析，再转本地
        if (/T/.test(raw)) {
            for (const fmt of [
                'YYYY-MM-DDTHH:mm',
                'YYYY-MM-DDTHH:mm:ss',
                'YYYY-MM-DDTHH:mm:ss.SSS',
            ]) {
                const d = dayjs.tz(isoish, fmt, 'UTC').tz(localTz);
                if (d.isValid()) return d;
            }
        }

        // 3) 无 'T' 且无时区：按 UTC 解析，再转本地
        for (const fmt of KNOWN_FORMATS) {
            const d = dayjs.tz(raw, fmt, 'UTC').tz(localTz);
            if (d.isValid()) return d;
        }

        return dayjs('');
    }

// 把“某天 + 时分”解析为本地时区的时刻（用于拼确认时间）
    function parseLocal(dateStr: string, timeStr: string) {
        const localTz = dayjs.tz.guess();

        // 统一用空格拼，不用 T，避免奇怪平台误判
        const raw = `${dateStr} ${timeStr}`.trim();

        // 同样按上面的已知格式严格解析
        for (const fmt of ['YYYY-MM-DD HH:mm', 'YYYY/MM/DD HH:mm']) {
            const d = dayjs.tz(raw, fmt, localTz);
            if (d.isValid()) return d;
        }
        return dayjs('');
    }
    const now = dayjs();
    // 根据 status 来做分类
    const filteredAppointments = appointments.filter(a => {
        if (filter === 'upcoming') {
            return ['confirmed', 'paid', 'reschedule_in_progress'].includes(a.status);
        }
        if (filter === 'past') {
            return a.status === 'completed' || toLocal(a.endTime).isBefore(now);
        }
        // cancelled
        return ['canceled', 'noshow'].includes(a.status);
    });
    const handleSlotCalendarChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null], fieldName: number[]) => {
        const [start, end] = dates;
        // If only start time is selected
        if (start && !end) {
            const autoEnd = start.add(1, 'hour');
            // Directly insert start + 1h into form
            form.setFieldsValue({
                slots: form.getFieldValue('slots').map((slot: any, idx: number) =>
                    idx === fieldName[0] ? [start, autoEnd] : slot
                )
            });
            // Conflict detection
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


    const fetchAppointments = useCallback(async () => {
        if (!mentorId) return;

        (async () => {
            setLoading(true);
            try {
                // 1) Get all appointments
                const apptRes = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers:{ 'Content-Type':'application/json' },
                    body: JSON.stringify({ user_id: mentorId }),
                });
                const apptJson = await apptRes.json();
                const rawAppts = apptJson.data.appointments as any[];

                // —— Only keep appointments where current user is mentor ——
                const mentorAppts = rawAppts.filter(a => a.mentor_id === mentorId);

                // 2) Pre-load mentee information for each appointment
                const otherIds = Array.from(new Set(
                    mentorAppts.map(a => a.mentee_id)
                ));
                const userMap: Record<string, any> = {};
                await Promise.all(otherIds.map(async id => {
                    const ures = await fetch(`/api/user/${id}`);
                    const { data } = await ures.json();
                    if (data) userMap[id] = data;
                }));


                // 3) Get the specific proposal for each appointment
                const enriched = await Promise.all(mentorAppts.map(async a => {
                    // parse timeslot…
                    const m = a.time_slot.match(/\[(.*?),(.*?)\)/) || [];

                    // note: build error with `dayjs.invalid`
                    // const start = m[1] ? dayjs.utc(m[1]).local() : dayjs.invalid;
                    // const end   = m[2] ? dayjs.utc(m[2]).local() : dayjs.invalid;
                    // note: not ideal, but use today's date as fallback
                    const start = m[1] ? toLocal(m[1]) : dayjs('');
                    const end   = m[2] ? toLocal(m[2]) : dayjs('');

                    const otherId = a.mentor_id === mentorId ? a.mentee_id : a.mentor_id;

                    // --- Key: Use otherId to get proposal list ---
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
                        date:        start.isValid() ? start.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                        time:        (start.isValid() && end.isValid())
                            ? `${start.format('HH:mm')} - ${end.format('HH:mm')}`
                            : `${dayjs().format('HH:mm')} - ${dayjs().add(1, 'hour').format('HH:mm')}`,
                        startTime:    start.isValid() ? start.toISOString() : dayjs().toISOString(),
                        endTime:      end.isValid() ? end.toISOString() : dayjs().add(1, 'hour').toISOString(),
                        status:      a.status,
                        description: a.description,
                        cancel_reason: a.cancel_reason,
                        service_type: a.service_type,
                        resume_url:  a.resume_url,
                        link:        a.link, // Add the meet link
                        otherUser: {
                            id:       otherId,
                            username: userMap[otherId]?.username || 'Anonymous',
                            mentor:   userMap[otherId]?.mentor    || false,
                            resume:   userMap[otherId]?.resume    || null,
                            profile_url: userMap[otherId]?.profile_url || null,
                        },
                        proposal,    // ← Must include this
                    };
                }));

                // const onlyMentees = enriched.filter(a => !a.otherUser.mentor);
                setAppointments(enriched);

            } catch (e: any) {
                console.error(e);
                message.error(e.message || 'Failed to load');
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
            // Split "HH:mm - HH:mm"
            const [startStr, endStr] = appt.time.split(' - ');
            // 拼成完整的 ISO 时间
            const s = parseLocal(appt.date, startStr);
            const e = parseLocal(appt.date, endStr);
            if (!s.isValid() || !e.isValid()) {
                return message.error('Invalid time format');
            }
            const startISO = s.toDate().toISOString();
            const endISO   = e.toDate().toISOString();

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

            // Debug: Log the response
            console.log('🔍 API Response:', { status: res.status, ok: res.ok, data });

            // Check both HTTP status and API response code
            if (!res.ok || data.code === -1) {
                console.error('❌ API Error Response:', data);
                throw new Error(data.message || 'Confirmation failed');
            }

            message.success('Session time confirmed');
            // Update local state
            setAppointments(list =>
                list.map(a =>
                    a.id === appt.id
                        ? { ...a, status: 'confirmed', time: `${startStr} - ${endStr}` }
                        : a
                )
            );
        } catch (err: any) {
            console.error('❌ Frontend Error:', err);
            message.error(err.message || 'Confirmation failed');
        }
    };
    // Accept: Update appointment (status + time_slot)
    const handleAccept = async (prop: Proposal) => {
        try {
            const selectedIdx = selectedProposal[prop.appointment_id];
            if (selectedIdx == null) {
                // WARN -> WARNING
                return message.warning('Please select a time slot first');
            }

            const [start_time, end_time] = prop.proposed_time_ranges[selectedIdx];

            const res = await fetch('/api/appointment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id: prop.appointment_id, start_time, end_time }),
            });
            const data = await res.json();

            // Debug: Log the response
            console.log('🔍 API Response (Accept):', { status: res.status, ok: res.ok, data });

            // Check both HTTP status and API response code
            if (!res.ok || data.code === -1) {
                console.error('❌ API Error Response (Accept):', data);
                throw new Error(data.message || 'Confirmation failed');
            }

            message.success('New time confirmed');
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
                            time: `${toLocal(start_time).format('HH:mm')} - ${toLocal(end_time).format('HH:mm')}`,
                        }
                        : a
                )
            );
        } catch (err: any) {
            console.error('❌ Frontend Error (Accept):', err);
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
            // 1. 校验表单
            const values = await form.validateFields();
            const ranges: [string, string][] = values.slots.map(
                (r: [dayjs.Dayjs, dayjs.Dayjs]) => [r[0].toISOString(), r[1].toISOString()]
            );

            // 2. 构造 payload
            const payload = {
                appointment_id: currentAppt!.id,
                proposed_time_ranges: ranges,
                proposer: mentorId,
                receiver: currentAppt!.otherUser.id,
                reason: rescheduleComment,    // ✅ 一定要带上 reason
            };
            await fetch(`/api/reschedule_proposal/${currentAppt!.id}`, {
                method: 'DELETE',
            });
            // 3. 调接口
            const res = await fetch('/api/appointment/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                // 后端返回错误信息时给用户提示
                throw new Error(data.message || `Server responded ${res.status}`);
            }

            message.success('Reschedule request sent!');
            form.resetFields();
            setIsRescheduleSlotsModalOpen(false);
            fetchAppointments();

        } catch (err: any) {
            console.error('handleRescheduleOk error:', err);
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
                        const endMoment = parseLocal(appt.date, endStr);
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

    // Add simple join functionality using existing appointment data
    const handleJoinClick = (appt: Appointment) => {
        if (appt.link) {
            // Open the meet link in a new window/tab
            window.open(appt.link, '_blank', 'noopener,noreferrer');
        }
        // If no link, do nothing - tooltip will show the message
    };
// 小工具：把动作渲染成「蓝色按钮（可点）/ 灰掉（禁点）」统一风格
    const ActionButton = ({
                              icon,
                              text,
                              onClick,
                              disabled = false,
                              danger = false,
                          }: {
        icon: React.ReactNode;
        text: string;
        onClick?: () => void;
        disabled?: boolean;
        danger?: boolean;
    }) => (
        <Button
            type="primary"
            danger={danger}
            disabled={disabled}
            onClick={onClick}
            block
            style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'normal',
                textAlign: 'center',
            }}
        >
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span>{text}</span>
    </span>
        </Button>
    );

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
                        const aStart = parseLocal(a.date, a.time.split(' - ')[0]);
                        const bStart = parseLocal(b.date, b.time.split(' - ')[0]);
                        return aStart.diff(bStart); // 时间近的排前面
                    })
                    .map(appt => (
                        <Card
                            key={appt.id}
                            style={{ marginBottom: 16 }}
                            title={
                                <div className={styles.apptHeader}>
                                    {/* 第一行：日期+时间 */}
                                    <div className={styles.apptRow1}>
                                        <Space align="center" size={16} wrap>
                                            <CalendarOutlined />
                                            <Text strong>{appt.date}</Text>
                                            <ClockCircleOutlined />
                                            <Text strong>
                                                {appt.time} {getShortTimeZone()}
                                            </Text>
                                        </Space>
                                    </div>

                                    {/* 第二行：左边倒计时 / 右边状态标签 */}
                                    <div className={styles.apptRow2}>
                                        <div className={styles.apptCountdown}>
                                            {appt.status !== 'canceled' && (
                                                appt.proposal?.status === 'pending' ? (
                                                    <Text className={styles.apptCountdownText}>
                                                        Waiting for Confirmation
                                                    </Text>
                                                ) : (() => {
                                                    const start = parseLocal(appt.date, appt.time.split(' - ')[0]);
                                                    const now = dayjs();
                                                    const diffInHours = start.diff(now, 'hour');
                                                    if (diffInHours <= 0) return null;
                                                    if (diffInHours < 24) {
                                                        return (
                                                            <Text className={styles.apptCountdownText}>
                                                                In {diffInHours} Hours
                                                            </Text>
                                                        );
                                                    }
                                                    const diffInDays = start.diff(now, 'day');
                                                    const hoursAfterDays = start.diff(now.add(diffInDays, 'day'), 'hour');
                                                    return (
                                                        <Text className={styles.apptCountdownText}>
                                                            In {diffInDays} Days {hoursAfterDays} Hours
                                                        </Text>
                                                    );
                                                })()
                                            )}
                                        </div>

                                        <Tag
                                            className={styles.apptStatusTag}
                                            style={{
                                                background: appt.status === 'canceled' ? '#FFF1F0' : '#E6F7FF',
                                                border: appt.status === 'canceled'
                                                    ? '1px solid #FFA39E'
                                                    : '1px solid #91D5FF',
                                                color: appt.status === 'canceled' ? '#FF4D4F' : '#1890FF',
                                            }}
                                        >
                                            {appt.status === 'confirmed'
                                                ? 'Upcoming'
                                                : appt.status === 'reschedule_in_progress'
                                                    ? 'Reschedule In Progress'
                                                    : appt.status}
                                        </Tag>
                                    </div>
                                </div>
                            }
                            actions={
                                filter === 'past'
                                    // Past 分页只显示 Report Issue
                                    ? [
                                        <div
                                            key="report-issue"
                                            className={styles.actionLink}
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
                                                        <div
                                                            key="reschedule"
                                                            className={styles.actionLink}
                                                            onClick={() => {
                                                                if (appt.service_type === 'Free Coffee Chat (15 Mins)') {
                                                                    return; // 禁用状态，不响应
                                                                }
                                                                showRescheduleModal(appt);
                                                            }}
                                                            style={{
                                                                color: '#1677ff',
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
                                                        <div key="cancel"
                                                             className={styles.actionLink}
                                                             onClick={() => showCancelModal(appt)}
                                                             style={{ cursor: 'pointer',
                                                                 color: '#1677ff', }}>
                                                            <CloseCircleOutlined style={{ fontSize: 18 }} /><div>Cancel</div>
                                                        </div>,
                                                        <div key="noshow"
                                                             className={styles.actionLink}
                                                             onClick={() => showReportModal(appt)}
                                                             style={{ cursor: 'pointer' ,
                                                                 color: '#1677ff', }}>
                                                            <FrownOutlined style={{ fontSize: 18 }} /><div>Report Issue</div>
                                                        </div>,
                                                        <Tooltip
                                                            title={appt.link ? "" : "No meeting link available yet. Please wait for the session to be confirmed."}
                                                        >
                                                            <div
                                                                key="join"
                                                                className={styles.actionLink}
                                                                onClick={() => handleJoinClick(appt)}
                                                                style={{
                                                                    color: '#1677ff',
                                                                    cursor: appt.link ? 'pointer' : 'not-allowed',
                                                                    opacity: appt.link ? 1 : 0.5
                                                                }}
                                                            >
                                                                <BellOutlined style={{ fontSize: 18 }} /><div>Join</div>
                                                            </div>
                                                        </Tooltip>,
                                                    ]
                                            )
                                    )
                            }
                        >
                            {/* —— 移除：原先 inline pending 区块 —— */}

                            <Space>
                                <Avatar
                                    src={appt.otherUser.profile_url || appt.otherUser.avatar_url}
                                >
                                    {appt.otherUser.username?.charAt(0)}
                                </Avatar>
                                <Text strong>{appt.otherUser.username}</Text>
                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                    ({appt.service_type})
                                </Text>
                            </Space>
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary">Notes:</Text>
                                <p>{appt.description}</p>
                            </div>

                            {/* 如果有 resume，则显示 */}
                            {appt.otherUser.resume && (
                                <a
                                    href={appt.otherUser.resume}
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
      {appt.otherUser.username} Resume
    </span>
                                </a>
                            )}
                        </Card>
                    ))
            )}

            <Modal
                title="Confirming Your Session"
                visible={isConfirmOpen}
                onCancel={() => setIsConfirmOpen(false)}
                footer={
                    [
                        <Button key="cancel" danger onClick={() => {
                            setIsConfirmOpen(false);
                            if (confirmAppt) {
                                setCurrentAppt(confirmAppt);
                                setIsCancelOpen(true);
                            }
                        }}>
                            Cancel Session
                        </Button>,

                        // only show “Reschedule” if NOT a free coffee chat
                        confirmAppt?.service_type !== 'Free Coffee Chat (15 Mins)' && (
                            <Button key="reschedule" onClick={() => {
                                setIsConfirmOpen(false);
                                if (confirmAppt) {
                                    setCurrentAppt(confirmAppt);
                                    setIsRescheduleReasonModalOpen(true);
                                }
                            }}>
                                Reschedule Session
                            </Button>
                        ),

                        <Button key="confirm" type="primary" onClick={() => {
                            if (confirmAppt) handleConfirmCurrentTime(confirmAppt);
                            setIsConfirmOpen(false);
                        }}>
                            Confirm the Session
                        </Button>,
                    ].filter(Boolean)  // remove the `false` entry when service_type is free
                }
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
                    <Avatar
                        size="small"
                        style={{ marginRight: 4 }}
                        src={confirmAppt?.otherUser.profile_url || confirmAppt?.otherUser.avatar_url}
                    >
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
                        {confirmAppt?.service_type}
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
                                    {toLocal(range[0]).format('MM/DD dddd h:mmA')} –{' '}
                                    {toLocal(range[1]).format('h:mmA')} {getShortTimeZone()}
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
                                                            return Promise.reject('Minutes can only be 0 or 30');
                                                        if (e.diff(s, 'minutes') !== 60)
                                                            return Promise.reject('Duration must be 1 hour');
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
        </div>
    );
}
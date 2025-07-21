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

const { Title, Text } = Typography;

function getShortTimeZone() {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
    const parts = dtf.formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
}

interface Proposal {
    id: string;                           // supabase 中，proposal.id === appointment_id
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
    service_type: string;
    resume_url?: string;
    otherUser: { id: string; username: string };
    proposal?: Proposal;
}
const bookedSlotsStatePlaceholder: [string, string][] = [];
type FilterKey = 'upcoming' | 'past' | 'cancelled';
export default function MySessionsTab() {
    const params = useParams();
    const menteeId = params?.id as string;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedProposal, setSelectedProposal] = useState<Record<string, number>>({});

    // Reschedule modal state
    const [currentAppt, setCurrentAppt] = useState<Appointment | null>(null);
    const [form] = Form.useForm();
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

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
    // 拉列表
    const fetchAppointments = useCallback(async () => {
        if (!menteeId) return;
        setLoading(true);
        try {
            // 1) 拿所有 appointment
            const apptRes = await fetch('/api/appointment/get', {
                method: 'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({ user_id: menteeId }),
            });
            const apptJson = await apptRes.json();
            const rawAppts = apptJson.data.appointments as any[];
            const menteeOnly = rawAppts.filter(a => a.mentee_id === menteeId);

            // 2) 拿所有 proposals
            const propRes = await fetch(`/api/reschedule_proposal/${menteeId}`);
            const propJson = await propRes.json();
            const allProps: Proposal[] = (propJson.data as any[]).map(p => ({
                id: p.id,
                appointment_id: p.id,
                proposed_time_ranges: p.proposed_time,
                status: 'pending',
            }));

            // 3) 预加载 otherUser
            const otherIds = Array.from(new Set(
                rawAppts.map(a => a.mentor_id === menteeId ? a.mentee_id : a.mentor_id)
            ));
            const userMap: Record<string, any> = {};
            await Promise.all(otherIds.map(async id => {
                const ures = await fetch(`/api/user/${id}`);
                const ujson = await ures.json();
                if (ujson.data) userMap[id] = ujson.data;
            }));

            // 4) enrich
            const enriched: Appointment[] = menteeOnly.map(a => {
                const m = a.time_slot.match(/\[(.*?),(.*?)\)/) || [];
                let start = dayjs(), end = dayjs();
                if (m.length === 3) {
                    start = dayjs.utc(m[1]).local();
                    end   = dayjs.utc(m[2]).local();
                }
                const date = start.format('YYYY-MM-DD');
                const time = `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
                const otherId = a.mentor_id === menteeId ? a.mentee_id : a.mentor_id;
                const proposal = allProps.find(p => p.appointment_id === a.id);
                return {
                    id: a.id,
                    date, time,
                    status: a.status,
                    description: a.description,
                    service_type: a.service_type,
                    resume_url: a.resume_url,
                    otherUser: { id: otherId, username: userMap[otherId]?.username || 'Anonymous' },
                    proposal,
                };
            });

            setAppointments(enriched);



        } catch (e: any) {
            console.error(e);
            message.error(e.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }, [menteeId]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    // Accept Mentor 的提案
    const handleAccept = async (prop: Proposal) => {
        const idx = selectedProposal[prop.appointment_id];
        if (idx == null) return message.warning('请先选择一个时间段');
        const [start_time, end_time] = prop.proposed_time_ranges[idx];
        try {
            const res = await fetch('/api/appointment/confirm', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ appointment_id: prop.appointment_id, start_time, end_time }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            message.success('已确认新时间');
            setAppointments(list => list.map(a => a.id===prop.appointment_id
                ? { ...a, status:'confirmed', time:`${dayjs(start_time).format('HH:mm')} - ${dayjs(end_time).format('HH:mm')}`,
                    proposal:{...a.proposal!, status:'accepted'} }
                : a));
        } catch (err:any) {
            message.error(err.message);
        }
    };

    // 点击 Review 按钮
    const openReview = (appt: Appointment) => {
        setReviewAppt(appt);
        setIsReviewOpen(true);
    };
    // 点击 Confirm 按钮
    const openConfirm = (appt: Appointment) => {
        setConfirmAppt(appt);
        setIsConfirmOpen(true);
    };
    // 点击 Reschedule 按钮
    const showRescheduleModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        form.resetFields();
        // —— 在这里只取出当前 mentor + 这个 mentee 已有的已确认时段 ——
        const slotsForThisPair: [string,string][] = appointments
            .filter(a =>
                (a.status === 'confirmed' || a.status === 'reschedule_in_progress')
                && a.otherUser.id === appt.otherUser.id  // 同一个 mentee
            )
            .map(a => {
                const [s, e] = a.time.split(' - ');
                return [
                    dayjs(`${a.date} ${s}`, 'YYYY-MM-DD HH:mm').toISOString(),
                    dayjs(`${a.date} ${e}`, 'YYYY-MM-DD HH:mm').toISOString()
                ];
            });
        setBookedSlots(slotsForThisPair);
        // —— 计算完毕 ——
        setIsRescheduleOpen(true);
    };
    // 点击 Cancel 按钮
    const showCancelModal = (appt: Appointment) => {
        setCurrentAppt(appt);
        setCancelReason('');
        setIsCancelOpen(true);
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
                    receiver: currentAppt!.otherUser.id,
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
                        const aStart = dayjs(`${a.date} ${a.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm');
                        const bStart = dayjs(`${b.date} ${b.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm');
                        return aStart.diff(bStart); // 时间近的排前面
                    })
                    .map(appt => (
                        <Card
                            key={appt.id}
                            style={{ marginBottom:16 }}
                            title={
                                <Space align="center" style={{ position:'relative', width:1056, height:28 }}>
                                    <CalendarOutlined/>
                                    <Text style={{ fontWeight:700, fontSize:16, lineHeight:'24px' }}>{appt.date}</Text>
                                    <ClockCircleOutlined style={{ marginLeft:16 }}/>
                                    <Text style={{ fontWeight:700, fontSize:16, lineHeight:'24px' }}>
                                        {appt.time} {getShortTimeZone()}
                                    </Text>
                                    {appt.status==='canceled' ? null
                                        : appt.proposal?.status==='pending'
                                            ? <Text style={{ marginLeft:54,fontWeight:700,fontSize:16,color:'#1890FF' }}>
                                                Waiting for Confirmation
                                            </Text>
                                            : <Text style={{ marginLeft:54,fontWeight:700,fontSize:16,color:'#1890FF' }}>
                                                {(() => {
                                                    const start = dayjs(`${appt.date} ${appt.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm');
                                                    const now = dayjs();
                                                    const diffInHours = start.diff(now, 'hour');
                                                    const diffInDays = start.diff(now, 'day');

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
                                            // 根据状态切换背景色和边框色
                                            background: appt.status === 'canceled' ? '#FFF1F0' : '#E6F7FF',
                                            border: appt.status === 'canceled'
                                                ? '1px dashed #FFA39E'
                                                : '1px dashed #91D5FF',
                                            borderRadius: 2,
                                            fontWeight: 400,
                                            fontSize: 12,
                                            lineHeight: '20px',
                                            // 根据状态切换字体颜色
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
                                appt.status!=='canceled'
                                    ? ( (appt.proposal?.status==='pending')
                                            ? [<Button key="review" type="primary" style={{ width:'100%' }} onClick={()=>{
                                                appt.status==='paid' ? openConfirm(appt) : openReview(appt);
                                            }}>
                                                <BellOutlined style={{ marginRight:8 }}/>
                                                Review and Confirm the Session Request
                                            </Button>]
                                            : [
                                                <div key="reschedule" onClick={()=>showRescheduleModal(appt)} style={{ cursor:'pointer' }}>
                                                    <CalendarTwoTone style={{ fontSize:18 }}/><div>Reschedule</div>
                                                </div>,
                                                <div key="cancel" onClick={()=>showCancelModal(appt)} style={{ cursor:'pointer' }}>
                                                    <CloseCircleOutlined style={{ fontSize:18 }}/><div>Cancel</div>
                                                </div>,
                                                <div key="noshow"><FrownOutlined style={{ fontSize:18 }}/><div>Report Issue</div></div>,
                                                <div key="join"><BellOutlined style={{ fontSize:18 }}/><div>Join</div></div>,
                                            ]
                                    )
                                    : []
                            }
                        >
                            <Space><Avatar>{appt.otherUser.username[0]}</Avatar><Text strong>{appt.otherUser.username}</Text>
                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                    ({appt.service_type})
                                </Text>
                            </Space>
                            <div style={{ marginTop:8 }}><Text type="secondary">Notes:</Text><p>{appt.description}</p></div>
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

            {/* Confirm Modal */}
            <Modal
                title="Confirming Your Session"
                visible={isConfirmOpen}
                onCancel={()=>setIsConfirmOpen(false)}
                footer={[
                    <Button key="cancel" danger onClick={()=>setIsConfirmOpen(false)}>Cancel Session</Button>,
                    <Button key="reschedule" onClick={()=>{
                        setIsConfirmOpen(false);
                        if (confirmAppt) showRescheduleModal(confirmAppt);
                    }}>Reschedule Session</Button>,
                    <Button key="confirm" type="primary" onClick={()=>{
                        if (confirmAppt) handleAccept(confirmAppt.proposal!);
                        setIsConfirmOpen(false);
                    }}>Confirm the Session</Button>,
                ]}
            >
                <div style={{ marginBottom:16 }}>
                    <Text strong>Session Time:</Text>{' '}
                    <Text style={{ fontWeight:400 }}>{confirmAppt?.date} {confirmAppt?.time} {getShortTimeZone()}</Text>
                </div>
                <div style={{ marginBottom:12, display:'flex',alignItems:'center' }}>
                    <Text strong style={{ marginRight:8 }}>Mentor:</Text>
                    <Avatar size="small" style={{ marginRight:4 }}>{confirmAppt?.otherUser.username[0]}</Avatar>
                    <Text>{confirmAppt?.otherUser.username}</Text>
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
                    (selectedProposal[reviewAppt?.id||''] === (reviewAppt?.proposal?.proposed_time_ranges.length||0))
                        ? <Button key="propose" type="primary" onClick={()=>{
                            setIsReviewOpen(false);
                            if (reviewAppt) showRescheduleModal(reviewAppt);
                        }}>Propose More Time</Button>
                        : <Button key="confirm" type="primary" onClick={()=>{
                            if (reviewAppt?.proposal) handleAccept(reviewAppt.proposal);
                            setIsReviewOpen(false);
                        }}>Confirm the New Time</Button>
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
                        {reviewAppt?.date} {reviewAppt?.time} {getShortTimeZone()}
                    </Text>
                    {reviewAppt?.proposal?.proposed_time_ranges.map((range,idx)=>(
                        <Radio key={idx} value={idx} style={{ display:'block', margin:'8px 0' }}>
                            <Space>
                                <Text>
                                    {dayjs(range[0]).format('MM/DD dddd h:mmA')} – {dayjs(range[1]).format('h:mmA')} {getShortTimeZone()}
                                </Text>
                            </Space>
                        </Radio>
                    ))}
                    <Radio value={(reviewAppt?.proposal?.proposed_time_ranges.length||0)} style={{ display:'block', margin:'8px 0' }}>
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
                    Based on your availability, please propose 3–5 one-hour time slots for <strong>Mentor:</strong> <u>{currentAppt?.otherUser.username}</u>
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
                                                { required:true, message:'Required' },
                                                {
                                                    validator:(_, value:[dayjs.Dayjs,dayjs.Dayjs])=>{
                                                        if (!value || value.length!==2) return Promise.reject('Pick a range');
                                                        const [s,e] = value;
                                                        if (s.minute()!==0||e.minute()!==0) return Promise.reject('Must be whole hours');
                                                        if (e.diff(s,'hour')!==1) return Promise.reject('Duration must be 1 hour');
                                                        return Promise.resolve();
                                                    }
                                                }
                                            ]}
                                        >
                                            <DatePicker.RangePicker
                                                showTime={{ format:'HH:mm' }}
                                                format="YYYY-MM-DD HH:mm"
                                                disabledDate={cur=>!!cur && cur<dayjs().startOf('day')}
                                                disabledTime={cur=>{
                                                    if (!cur) return {};
                                                    const blocked = new Set<number>();
                                                    bookedSlots.forEach(([s,e])=>{
                                                        const st=dayjs(s), en=dayjs(e);
                                                        if (st.isSame(cur,'day')) {
                                                            for(let h=st.hour();h<en.hour();h++) blocked.add(h);
                                                        }
                                                    });
                                                    return {
                                                        disabledHours:()=>Array.from(blocked),
                                                        disabledMinutes:()=>Array.from({length:59},(_,i)=>i+1),
                                                        disabledSeconds:()=>Array.from({length:59},(_,i)=>i+1),
                                                    };
                                                }}
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
                            onClick={async()=>{
                                if (!currentAppt) return;
                                try {
                                    await fetch('/api/appointment/update', {
                                        method:'POST', headers:{'Content-Type':'application/json'},
                                        body: JSON.stringify({
                                            appointment_id: currentAppt.id,
                                            status: 'canceled',
                                            description: cancelReason,
                                        }),
                                    });
                                    message.success('Session canceled');
                                    setAppointments(list => list.map(a => a.id===currentAppt.id?{...a,status:'canceled'}:a));
                                } catch(err:any){
                                    message.error(err.message||'Cancel failed');
                                } finally {
                                    setIsCancelOpen(false);
                                }
                            }}
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
        </div>
    );
}
'use client';
import {Layout, Typography, Card, Tag, Avatar, Button, message, Modal, Select, Upload, Input} from 'antd';
import {LinkedinFilled, UserOutlined, DeleteOutlined, FileOutlined} from '@ant-design/icons';
import {SignedIn, SignedOut, SignInButton, useUser} from '@clerk/nextjs';

import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';
import { useState, useEffect, useRef, useMemo } from 'react';
import {useRouter, useParams} from 'next/navigation';
import dayjs from 'dayjs';
import type {UploadFile} from 'antd/es/upload/interface';
import NavBar from '../../components/Navbar';
import moment from 'moment-timezone';
import DOMPurify from 'isomorphic-dompurify';

import {isFreeCoffeeChat} from '../../services/constants';
import {netToGross} from '../../services/priceHelper';

import {Tabs} from 'antd';
import MentorReviews from '../components/MentorReview';

import {usePathname} from 'next/navigation';
import {Grid} from 'antd';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Popover } from 'antd';

const {Content} = Layout;
const {Title, Text} = Typography;
const {TextArea} = Input;

export default function MentorDetailsPage() {
    const {user, isSignedIn} = useUser();
    const router = useRouter();
    const params = useParams() as { id: string };
    const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [description, setDescription] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [mentorLoading, setMentorLoading] = useState(true);
    // stripe和微信支付
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'wechat'>('stripe');
    const [price, setPrice] = useState<number | null>(null);
    const [appointmentId, setAppointmentId] = useState<string | null>(null);
    const [isWeChatModalVisible, setIsWeChatModalVisible] = useState(false);
    const [qrScanned, setQrScanned] = useState(false);
    const [isPaymentFailedModalVisible, setIsPaymentFailedModalVisible] = useState(false);
    const [userResume, setUserResume] = useState<string | null>(null);
    const [coffeeChatCount, setCoffeeChatCount] = useState<number | null>(null);

    const mentorIdForReviews = mentor?.user_id;

    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

    const {useBreakpoint} = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [showTrialTip, setShowTrialTip] = useState(true);

    const availabilityRef = useRef<HTMLDivElement | null>(null);

    // 统一把 service 表示成字符串：无论后端给的是 string 还是 { type, price }
    const normalizeServiceType = (s: any) =>
        (typeof s === 'string' ? s : (s?.type ?? '')).trim().toLowerCase();

    // [ADDED] 用规范化过的 key 反查 service 对象/展示文案
    const getServiceByKey = (services: any[] | undefined | null, key: string | null) => {
        if (!key || !Array.isArray(services)) return null;
        return services.find((s) => normalizeServiceType(s) === key) ?? null;
    };
    const getRawLabelByKey = (services: any[] | undefined | null, key: string | null) => {
        const s = getServiceByKey(services, key);
        return s ? (typeof s === 'string' ? s : (s.type ?? '')) : '';
    };

    const sanitizedIntro = useMemo(
        () => DOMPurify.sanitize(mentor?.introduction || '', {
            ALLOWED_TAGS: ['p','strong','em','u','ol','ul','li','h1','h2','h3','a','img','br','span'],
            ALLOWED_ATTR: ['href','target','rel','src','alt']
        }),
        [mentor?.introduction]
    );

    const [supportType, setSupportType] = useState<string | null>(null);
    // 每次刷新页面时，主动清空之前的缓存
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('selectedService');
        }
    }, []);
    // [ADDED] 当 mentor.services 变化时，校验当前已选 key 是否还存在
    useEffect(() => {
        if (!Array.isArray(mentor?.services)) return;
        if (!supportType) return;
        const allKeys = mentor.services.map(normalizeServiceType);
        if (!allKeys.includes(supportType)) {
            setSupportType(null);
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('selectedService');
            }
        }
    }, [mentor?.services]);

    const hasFreeCoffee =
        Array.isArray(mentor?.services) &&
        mentor.services.some(
            (s: any) => typeof s?.type === 'string' && /free coffee chat/i.test(s.type)
        );

    const showFreeTrialBanner =
        hasFreeCoffee &&
        coffeeChatCount !== null &&
        coffeeChatCount === 0;

    const scrollToAvailability = () => {
        if (isMobile) {
            setIsAvailabilityModalOpen(true);
        } else {
            availabilityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        // 初始根据 hash 设定 tab
        const initial = (window.location.hash || '#overview').replace('#', '') as 'overview' | 'reviews';
        setActiveTab(initial);

        // 监听 hash 变化（例如外部跳转 /mentor/xxx#reviews）
        const onHashChange = () => {
            const key = (window.location.hash || '#overview').replace('#', '') as 'overview' | 'reviews';
            setActiveTab(key);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    // 简历文件列表
    const resumeFileList: UploadFile[] = resume
        ? [{
            uid: '-1',
            name: resume.name,
            status: 'done' as const,
            url: URL.createObjectURL(resume),
        }]
        : userResume
            ? [{
                uid: '-2',
                name: userResume.split('/').pop()!,
                status: 'done' as const,
                url: userResume,
            }]
            : [];

    function getUserTimeZoneAbbreviation(): string {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return moment.tz(timeZone).format('z'); // e.g., PST, EST, CET
        } catch {
            return '';
        }
    }

    useEffect(() => {
        const fetchMenteeResume = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch(`/api/user/${user.id}`);
                const result = await res.json();
                if (res.ok && result.data) {
                    setUserResume(result.data.resume || null);
                }
            } catch (err) {
                console.error('Failed to fetch user resume:', err);
            }
        };
        fetchMenteeResume();
    }, [user?.id]);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const res = await fetch(`/api/user/${params.id}`);
                const result = await res.json();

                if (!res.ok || !result.data) {
                    message.error('Failed to load mentor data');
                    return;
                }

                const mergedMentor = {
                    ...result.data,
                    ...(result.data.mentor || {}),
                };
                setMentor(mergedMentor);

            } catch (err) {
                console.error('Error fetching mentor:', err);
                message.error('Unexpected error fetching mentor');
            } finally {
                setMentorLoading(false);
            }
        };

        fetchMentor();
    }, [params.id]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'paymentSuccess') {
                setIsSuccessModalVisible(true);
                setIsBookingModalVisible(false);
                setStep(1);
            }

            if (event.data?.type === 'paymentFailed') {
                console.log('🟠 Received paymentFailed from child window');
                setIsBookingModalVisible(false);
                setIsPaymentFailedModalVisible(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const fetchCoffeeChatCount = async () => {
            if (!user?.id || !mentor?.user_id) return;
            try {
                const res = await fetch(`/api/user/${user.id}/get_coffee_chat_time`);
                const result = await res.json();
                if (res.ok) {
                    setCoffeeChatCount(result.data);
                } else {
                    console.error('Failed to fetch coffee chat count');
                }
            } catch (err) {
                console.error('Error fetching coffee chat count:', err);
            }
        };

        fetchCoffeeChatCount();
    }, [user?.id, mentor?.user_id]);

    const handleNext = async () => {
        if (step === 2) {
            let resumeUrl = userResume;

            if (!resumeUrl && resume) {
                try {
                    const res = await fetch('/api/resume/upload', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userId: user?.id,
                            fileName: `${Date.now()}_${resume?.name}`,
                        }),
                    });

                    const {signedUrl, fileUrl, error} = await res.json();
                    if (!signedUrl || !fileUrl || error) {
                        message.error('Failed to get S3 upload URL');
                        return;
                    }

                    const uploadResponse = await fetch(signedUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': resume.type,
                        },
                        body: resume,
                    });

                    if (!uploadResponse.ok) {
                        message.error('Failed to upload resume to S3');
                        return;
                    }

                    resumeUrl = fileUrl;
                    setUserResume(fileUrl);
                } catch (err) {
                    console.error('Resume upload error:', err);
                    message.error('Unexpected error uploading resume');
                    return;
                }
            }

            if (supportType && mentor?.services && selectedSlot?.date && selectedSlot?.time) {
                try {
                    const dateStr = selectedSlot.date;
                    const timeStr = selectedSlot.time;
                    const [startTimeStr] = timeStr.split(' - ');
                    const startTimeObj = dayjs(`${dateStr} ${startTimeStr}`, 'YYYY-MM-DD h:mm A');

                    let endTimeObj: dayjs.Dayjs;

                    // [CHANGED] 先用 key 反查“原始文案”再判断是否 Free
                    const rawLabel = getRawLabelByKey(mentor?.services, supportType); // ★
                    if (isFreeCoffeeChat(rawLabel)) { // ★
                        endTimeObj = startTimeObj.add(15, 'minute');
                    } else {
                        const [, endTimeStr] = timeStr.split(' - ');
                        endTimeObj = dayjs(`${dateStr} ${endTimeStr}`, 'YYYY-MM-DD h:mm A');
                    }

                    // [CHANGED] 价格同样基于反查到的 service
                    const selectedService = getServiceByKey(mentor?.services, supportType); // ★
                    const rawNetPrice = typeof selectedService === 'string' ? 0 : (selectedService?.price ?? 0); // ★
                    const calculatedPrice = isFreeCoffeeChat(rawLabel) ? 0 : netToGross(rawNetPrice); // ★

                    setPrice(calculatedPrice);

                    if (isFreeCoffeeChat(rawLabel)) { // ★
                        if (!user?.id) {
                            message.error('User not signed in');
                            return;
                        }
                        const response = await fetch('/api/appointment/insert', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                mentor_id: mentor.user_id,
                                mentee_id: user.id,
                                start_time: startTimeObj.toISOString(),
                                end_time: endTimeObj.toISOString(),
                                service_type: rawLabel, // [CHANGED] 存原始文案更清晰
                                description: description.trim(),
                                price: 0,
                            }),
                        });

                        const result = await response.json();

                        if (!response.ok || result.code === -1 || !result.data?.appointment_id) {
                            message.error(result.message || 'Failed to create appointment');
                            return;
                        }

                        setIsBookingModalVisible(false);
                        setIsSuccessModalVisible(true);
                        setStep(1);
                        return; // ⛔ 不继续进入 Step 3
                    }
                } catch (error) {
                    console.error('Failed to calculate session time/price:', error);
                }
            }
        }

        setStep(step + 1);
    };

    const handleBack = () => {
        if (step === 1) {
            setIsBookingModalVisible(false);
        } else {
            setStep(step - 1);
        }
    };

    const supportTopicsOptions = Array.isArray(mentor?.services)
        ? mentor.services.map((service: any) => {
            const rawLabel = typeof service === 'string' ? service : service.type; // 展示
            const key = normalizeServiceType(service);                             // 值
            const isFreeChat = isFreeCoffeeChat(rawLabel);
            const coffeeCount = coffeeChatCount ?? 0;
            const usedUp = isFreeChat && coffeeCount > 0;

            return {
                value: key,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{rawLabel}</span>
                        {isFreeChat && (
                            <span style={{ color: '#1890ff', marginLeft: 8, fontSize: 12 }}>
                                {usedUp ? '0/1 free times left' : '1/1 free times left'}
                            </span>
                        )}
                    </div>
                ),
                disabled: usedUp,
            };
        })
        : [];

    const userTzAbbr = getUserTimeZoneAbbreviation();

    const handleBecomeMentor = () => {
        if (!isSignedIn) return;
        router.push(`/signup/mentor/${user?.id}`);
    };

    if (mentorLoading) return <div style={{padding: 24}}>Loading mentor info...</div>;
    if (!mentor) return <div style={{padding: 24}}>Mentor not found.</div>;

    return (
        <Layout className={styles.layout}>
            <NavBar/>
            <Content style={{paddingTop: 88}} className={styles.content}>
                <div className={styles.container}>

                    <div className={styles.mainContent}>
                        <div className={styles.leftSection}>
                            <div className={styles.profileHeader}>
                                <Avatar
                                    size={120}
                                    src={mentor.profile_url || undefined}
                                    icon={!mentor.profile_url ? <UserOutlined/> : undefined}
                                    style={{background: '#f0f0f0'}}
                                />
                                <div className={styles.profileText}>
                                    <Title level={2} className={styles.name}>{mentor.username}</Title>
                                    <Text className={styles.jobTitle}>
                                        {mentor.title} @{mentor.company}
                                    </Text>
                                </div>
                                {mentor.linkedin && (
                                    <div className={styles.socialIconWrapper}>
                                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer">
                                            <LinkedinFilled className={styles.socialIcon}/>
                                        </a>
                                    </div>
                                )}
                            </div>
                            <Tabs
                                activeKey={activeTab}
                                onChange={(key) => {
                                    const k = key as 'overview' | 'reviews';
                                    setActiveTab(k);
                                    router.replace(`${pathname}#${k}`, {scroll: false});
                                }}
                                items={[
                                    {
                                        key: 'overview',
                                        label: 'Overview',
                                        children: (
                                            <>
                                                <Card
                                                    className={styles.infoCard}
                                                    title="Introduction"
                                                    bordered
                                                    style={{marginBottom: 24}}
                                                >
                                                    {mentor.introduction ? (
                                                        <div
                                                            className={styles.quillContent}
                                                            dangerouslySetInnerHTML={{ __html: sanitizedIntro }}
                                                        />
                                                    ) : (
                                                        <Text type="secondary">
                                                            This mentor has not provided an introduction yet.
                                                        </Text>
                                                    )}
                                                </Card>

                                                <Card className={styles.infoCard} title="Services" bordered>
                                                    <div className={styles.serviceGrid}>
                                                        {Array.isArray(mentor.services) && mentor.services.length > 0 ? (
                                                            mentor.services.map((service: any, idx: number) => {
                                                                const rawLabel = typeof service === 'string' ? service : service.type; // 展示用
                                                                const key = normalizeServiceType(service);                             // 比较/存储用
                                                                const price = typeof service === 'string' ? 0 : (service?.price ?? 0);
                                                                const priceText = isFreeCoffeeChat(rawLabel) ? 'Free' : `$${netToGross(price)}`;
                                                                const isSelected = supportType === key;                                // ✅ 用规范化 key 做比较

                                                                return (
                                                                    <Button
                                                                        key={idx}
                                                                        type={isSelected ? 'primary' : 'default'}
                                                                        className={styles.serviceButton}
                                                                        onClick={() => {
                                                                            setSupportType(key);                                             // ✅ 存规范化 key
                                                                            sessionStorage.setItem('selectedService', key);                  // ✅ 同步到 sessionStorage
                                                                            scrollToAvailability();
                                                                        }}
                                                                        block
                                                                    >
                                                                        <span className={styles.serviceTitle}>{rawLabel}</span>
                                                                        <span className={styles.servicePrice}>{priceText}</span>
                                                                    </Button>
                                                                );
                                                            })
                                                        ) : (
                                                            <Text type="secondary">This mentor has not listed any services.</Text>
                                                        )}
                                                    </div>
                                                </Card>
                                            </>
                                        ),
                                    },
                                    {
                                        key: 'reviews',
                                        label: 'Reviews',
                                        children: (
                                            <Card className={styles.infoCard} title="Reviews" bordered>
                                                {mentorIdForReviews ? (
                                                    <MentorReviews mentorId={mentorIdForReviews}/>
                                                ) : (
                                                    <Text type="secondary">No mentor selected.</Text>
                                                )}
                                            </Card>
                                        ),
                                    },
                                ]}
                            />

                        </div>

                        <div className={styles.rightSection}>
                            <Title level={3} className={styles.availabilityHeader}>Mentor's Availability</Title>

                            <div ref={availabilityRef}>
                                {!isMobile && (
                                    <MentorAvailability
                                        mentorId={mentor.user_id}
                                        services={mentor.services || []}
                                        onSlotSelect={(slot) => setSelectedSlot(slot)}
                                        onBook={() => {
                                            if (!isSignedIn) {
                                                router.push('/login');
                                                return;
                                            }
                                            setStep(2);
                                            setIsBookingModalVisible(true);
                                        }}
                                        coffeeChatCount={coffeeChatCount ?? 0}
                                        selectedServiceType={getRawLabelByKey(mentor?.services, supportType)} // [CHANGED] 传原始文案
                                    />
                                )}
                            </div>

                            {isMobile && (
                                <>
                                    <Card>
                                        <Button
                                            type="primary"
                                            block
                                            onClick={() => {
                                                setIsAvailabilityModalOpen(true);
                                            }}
                                        >
                                            Check Availability
                                        </Button>
                                    </Card>

                                    <Modal
                                        title={<div style={{ fontWeight: 600, fontSize: 18 }}>Book Session</div>}
                                        open={isAvailabilityModalOpen}
                                        footer={null}
                                        onCancel={() => setIsAvailabilityModalOpen(false)}
                                        width="100%"
                                        style={{ top: 16 }}
                                        bodyStyle={{ paddingTop: 8, paddingBottom: 8 }}
                                        getContainer={() => document.body}
                                        zIndex={10900}
                                    >
                                        <MentorAvailability
                                            mentorId={mentor.user_id}
                                            services={mentor.services || []}
                                            onSlotSelect={(slot) => setSelectedSlot(slot)}
                                            onBook={() => {
                                                if (!isSignedIn) {
                                                    setIsAvailabilityModalOpen(false);
                                                    router.push('/login');
                                                    return;
                                                }
                                                setIsAvailabilityModalOpen(false);
                                                setStep(2);
                                                setIsBookingModalVisible(true);
                                            }}
                                            coffeeChatCount={coffeeChatCount ?? 0}
                                            selectedServiceType={getRawLabelByKey(mentor?.services, supportType)} // [CHANGED]
                                        />
                                    </Modal>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </Content>

            <Modal
                title={null}
                open={isBookingModalVisible}
                footer={null}
                onCancel={() => {
                    setIsBookingModalVisible(false);
                    setStep(1);
                }}
                zIndex={10900}
            >
                {step === 1 && selectedSlot && (
                    <div>
                        <p>You are booking a session with {mentor.username} on:</p>
                        <p><strong>Date:</strong> {selectedSlot.date}</p>
                        <p><strong>Time:</strong> {selectedSlot.time}</p>
                        <p><strong>Service:</strong> Mock Interview</p>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <p style={{fontSize: 20, fontWeight: 600, marginBottom: 20}}>
                            Share the information below with the mentor.
                        </p>

                        {selectedSlot?.time && (
                            <p style={{fontSize: 15, fontWeight: 500, marginBottom: 20}}>
                                {/* [CHANGED] 用原始文案判断是否 Free */}
                                {(() => {
                                    const rawLabel = getRawLabelByKey(mentor?.services, supportType);
                                    return (
                                        <>Session Time: {isFreeCoffeeChat(rawLabel)
                                            ? (() => {
                                                const [start] = selectedSlot.time.split(' - ');
                                                const startTime = dayjs(`${selectedSlot.date} ${start}`, 'YYYY-MM-DD h:mm A');
                                                const endTime = startTime.add(15, 'minute');
                                                return `${startTime.format('h:mm A')} - ${endTime.format('h:mm A')} ${userTzAbbr}`;
                                            })()
                                            : `${selectedSlot.time} ${userTzAbbr}`}</>
                                    );
                                })()}
                            </p>
                        )}

                        <p style={{marginBottom: 8}}>
                            <strong>
                                What kind of support are you looking for? <span style={{color: 'red'}}>*</span>
                            </strong>
                        </p>
                        <Select
                            style={{ width: '100%', marginBottom: 16 }}
                            placeholder="Pick the topic you want to focus on."
                            options={supportTopicsOptions}
                            value={supportType}
                            onChange={(v) => {
                                setSupportType(v);
                                if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('selectedService', v);
                                }
                            }}
                        />

                        <p style={{marginBottom: 8, marginTop: 24}}><strong>Help your mentor understand you
                            better</strong></p>
                        <TextArea
                            rows={4}
                            placeholder="Share your goals, background, resume link, portfolio, or anything else that will help your mentor understand you better."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <p style={{marginBottom: 8, marginTop: 24}}><strong>Upload your resume (Optional)</strong></p>

                        <div style={{
                            backgroundColor: '#fff',
                            border: 'none',
                            boxShadow: 'none',
                            borderRadius: 0,
                            padding: 0,
                        }}>
                            {resumeFileList.length > 0 && (
                                <div
                                    style={{
                                        border: '1px solid #d9d9d9',
                                        borderBottom: 'none',
                                        borderTopLeftRadius: 8,
                                        borderTopRightRadius: 8,
                                        padding: '12px 16px',
                                        marginBottom: 0,
                                        backgroundColor: '#fff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                        <FileOutlined style={{fontSize: 16}}/>
                                        <a
                                            href={resumeFileList[0].url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{fontWeight: 500}}
                                        >
                                            {resumeFileList[0].name}
                                        </a>
                                        <span style={{color: '#999', fontSize: 13}}>
                                            {dayjs().format('MM/DD/YYYY')} Uploaded
                                        </span>
                                    </div>
                                    <DeleteOutlined
                                        style={{color: '#999', cursor: 'pointer'}}
                                        onClick={async () => {
                                            setResume(null);
                                            setUserResume(null);

                                            if (user?.id) {
                                                await fetch('/api/user/update', {
                                                    method: 'POST',
                                                    headers: {'Content-Type': 'application/json'},
                                                    body: JSON.stringify({
                                                        userId: user.id,
                                                        resume: null,
                                                    }),
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            <Upload.Dragger
                                beforeUpload={(file) => {
                                    setResume(file);
                                    setUserResume(null);
                                    return false;
                                }}
                                onRemove={() => {
                                    setResume(null);
                                    setUserResume(null);
                                }}
                                fileList={resumeFileList}
                                maxCount={1}
                                showUploadList={false}
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                style={{backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 8}}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 8
                                }}>
                                    <img src="/upload-icon.png" alt="upload" style={{height: 32}}/>
                                </div>
                                <p className="ant-upload-text" style={{fontWeight: 500, textAlign: 'center'}}>
                                    Click or drag file to this area {resume || userResume ? 'to replace' : 'to upload'}
                                </p>
                                <p className="ant-upload-hint" style={{textAlign: 'center'}}>
                                    Please upload your resume here (<strong>PDF format only</strong>).<br/>
                                    Only one file is allowed. Uploading company-sensitive information or any prohibited
                                    files is strictly forbidden.
                                </p>
                            </Upload.Dragger>

                        </div>
                    </div>
                )}

                {step === 3 && (
                    // [CHANGED] 用原始文案判断 Free
                    isFreeCoffeeChat(getRawLabelByKey(mentor?.services, supportType)) ? (
                        <div>
                            <Title level={4} style={{marginBottom: 20}}>Confirm Free Session</Title>
                            <p style={{fontSize: 16, color: '#52c41a', marginBottom: 20}}>
                                This is a free session. No payment is required.
                            </p>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24}}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        if (!selectedSlot || !supportType || !mentor || !user?.id) {
                                            message.error('Missing required booking info');
                                            return;
                                        }

                                        try {
                                            const dateStr = selectedSlot.date;
                                            const timeStr = selectedSlot.time;
                                            const [startTimeStr] = timeStr.split(' - ');
                                            const startTimeObj = dayjs(`${dateStr} ${startTimeStr}`, 'YYYY-MM-DD h:mm A');
                                            const endTimeObj = startTimeObj.add(15, 'minute');

                                            const start_time = startTimeObj.toISOString();
                                            const end_time = endTimeObj.toISOString();

                                            const response = await fetch('/api/appointment/insert', {
                                                method: 'POST',
                                                headers: {'Content-Type': 'application/json'},
                                                body: JSON.stringify({
                                                    mentor_id: mentor.user_id,
                                                    mentee_id: user.id,
                                                    start_time,
                                                    end_time,
                                                    service_type: getRawLabelByKey(mentor?.services, supportType), // [CHANGED]
                                                    description: description.trim(),
                                                    price: 0,
                                                }),
                                            });

                                            const result = await response.json();

                                            if (!response.ok || result.code === -1 || !result.data?.appointment_id) {
                                                message.error(result.message || 'Failed to create appointment');
                                                return;
                                            }

                                            setIsBookingModalVisible(false);
                                            setIsSuccessModalVisible(true);
                                            setStep(1);
                                        } catch (err) {
                                            console.error('Failed to create free appointment:', err);
                                            message.error('Unexpected error creating appointment');
                                        }
                                    }}
                                >
                                    Confirm Booking
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Title level={4} style={{marginBottom: 28}}>Payment Method</Title>

                            <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>Which way would you like to pay?</span>

                                <Popover
                                    placement="right"
                                    overlayInnerStyle={{ maxWidth: 300, lineHeight: 1.5 }}
                                    content={
                                        <div style={{ color: '#8c8c8c' }}>
                                            <div>
                                                You can get full refund if canceled <b>48hr</b> before the session. We will charge <b>$5</b> if canceled within <b>48hr</b>.
                                            </div>
                                        </div>
                                    }
                                >
                                    <button
                                        type="button"
                                        className={styles.infoBadge}
                                        aria-label="Refund policy tooltip"
                                    >
                                        <ExclamationCircleOutlined />
                                    </button>
                                </Popover>
                            </p>

                            <div
                                className={styles.payRow}
                                style={{
                                    border: selectedPaymentMethod === 'stripe' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                    borderRadius: 8,
                                    padding: '24px 20px',
                                    marginBottom: 20,
                                    minHeight: 80,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setSelectedPaymentMethod('stripe')}
                            >
                                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                                    <input type="radio" checked={selectedPaymentMethod === 'stripe'} readOnly/>
                                    <img src="/stripe-icon.png" alt="Stripe" style={{height: 24}}/>
                                    <span style={{fontSize: 16, fontWeight: 500}}>Pay in USD (U.S. Dollar)</span>
                                </div>
                                <div style={{fontSize: 18, fontWeight: 600}}>
                                    ${price ? price.toFixed(2) : '0.00'}
                                </div>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24}}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        if (!selectedSlot || !supportType || !mentor || !user?.id) {
                                            message.error('Missing required booking info');
                                            return;
                                        }

                                        try {
                                            const dateStr = selectedSlot.date;
                                            const timeStr = selectedSlot.time;
                                            const [startTimeStr] = timeStr.split(' - ');
                                            const startTimeObj = dayjs(`${dateStr} ${startTimeStr}`, 'YYYY-MM-DD h:mm A');
                                            const [, endTimeStr] = timeStr.split(' - ');
                                            const endTimeObj = dayjs(`${dateStr} ${endTimeStr}`, 'YYYY-MM-DD h:mm A');

                                            const start_time = startTimeObj.toISOString();
                                            const end_time = endTimeObj.toISOString();

                                            // [CHANGED] 通过 key 获取 service & 价格，再判断是否 Free
                                            const rawLabel = getRawLabelByKey(mentor?.services, supportType); // ★
                                            const selectedService = getServiceByKey(mentor?.services, supportType); // ★
                                            const rawNetPrice = typeof selectedService === 'string' ? 0 : (selectedService?.price ?? 0); // ★
                                            const calculatedPrice = isFreeCoffeeChat(rawLabel) ? 0 : netToGross(rawNetPrice); // ★

                                            const response = await fetch('/api/appointment/insert', {
                                                method: 'POST',
                                                headers: {'Content-Type': 'application/json'},
                                                body: JSON.stringify({
                                                    mentor_id: mentor.user_id,
                                                    mentee_id: user.id,
                                                    start_time,
                                                    end_time,
                                                    service_type: rawLabel, // [CHANGED] 存原始文案
                                                    description: description.trim(),
                                                    price: calculatedPrice,
                                                }),
                                            });

                                            const result = await response.json();

                                            if (!response.ok || result.code === -1 || !result.data?.appointment_id) {
                                                message.error(result.message || 'Failed to create appointment');
                                                return;
                                            }

                                            const appointmentId = result.data.appointment_id;

                                            if (selectedPaymentMethod === 'stripe') {
                                                const checkoutResponse = await fetch('/api/checkout', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        amount: calculatedPrice * 100,
                                                        appointmentId,
                                                        menteeUserId: user.id
                                                    }),
                                                });

                                                if (!checkoutResponse.ok) {
                                                    const errorData = await checkoutResponse.json();
                                                    throw new Error(errorData.error || 'Failed to create checkout session');
                                                }

                                                const checkoutData = await checkoutResponse.json();

                                                if (!checkoutData.sessionUrl) {
                                                    throw new Error('No checkout session URL received');
                                                }

                                                if (typeof window !== 'undefined') {
                                                    sessionStorage.setItem('stripe_session_id', checkoutData.sessionId);
                                                    sessionStorage.setItem('appointment_id', appointmentId);
                                                }

                                                setIsBookingModalVisible(false);
                                                window.location.href = checkoutData.sessionUrl;

                                            } else if (selectedPaymentMethod === 'wechat') {
                                                setAppointmentId(appointmentId);
                                                setPrice(calculatedPrice);
                                                setIsWeChatModalVisible(true);
                                            }

                                        } catch (err) {
                                            console.error('Failed to create paid appointment:', err);
                                            message.error('Unexpected error creating appointment');
                                        }
                                    }}
                                >
                                    {selectedPaymentMethod === 'stripe' ? 'Pay Now' : 'Pay for the Session'}
                                </Button>
                            </div>
                        </div>
                    )
                )}

                {(step === 1 || step === 2) && (
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24}}>
                        <Button onClick={handleBack}>Back</Button>
                        <Button type="primary" onClick={handleNext}>Next</Button>
                    </div>
                )}

            </Modal>

            <Modal
                open={isSuccessModalVisible}
                footer={null}
                onCancel={() => setIsSuccessModalVisible(false)}
                width={560}
                getContainer={() => document.body}
                zIndex={11000}
            >
                <div style={{ padding: '8px 4px' }}>
                    <Title level={4} style={{ marginBottom: 12 }}>
                        🎉 Succeed -- Request Sent to Mentor
                    </Title>

                    <div style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14 }}>
                            <strong>Session Time:</strong> {dayjs(selectedSlot?.date).format('MM/DD/YYYY')} {selectedSlot?.time} {userTzAbbr}
                        </Text>
                        <br />
                        <Text style={{ fontSize: 14 }}>
                            <strong>Mentor:</strong>
                            <Avatar
                                size={30}
                                src={mentor?.profile_url || undefined}
                                icon={!mentor?.profile_url ? <UserOutlined /> : undefined}
                                style={{ marginRight: 8, verticalAlign: 'middle' }}
                            />
                            {mentor?.username || 'User Name Placeholder'}
                            <Text style={{ color: '#1890ff', marginLeft: 8 }}>
                                Waiting for confirmation
                            </Text>
                        </Text>
                        <br />
                        <Text style={{ fontSize: 14 }}>
                            <strong>Service Type:</strong>{' '}
                            {/* [CHANGED] 简化为通过 key 取原始文案 */}
                            {getRawLabelByKey(mentor?.services, supportType) || 'Free Trial Session - 15min'}
                        </Text>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        <Button onClick={() => setIsSuccessModalVisible(false)}>
                            Stay On This Page
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => router.push(`/mentee-profile/${user?.id}#sessions`)}
                        >
                            View All My Booked Sessions
                        </Button>

                    </div>
                </div>
            </Modal>

            <Modal
                open={isWeChatModalVisible}
                footer={null}
                onCancel={() => {
                    setIsWeChatModalVisible(false);
                    setQrScanned(false);
                }}
                width={800}
                zIndex={10900}
            >
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{textAlign: 'center'}}>
                        <Title level={3}>Payment</Title>
                        <p style={{fontSize: 16}}>打开 <img src="/wechat-pay.png" alt="WeChat"
                                                          style={{height: 20, verticalAlign: 'middle'}}/> 微信扫一扫
                        </p>
                        <p style={{fontSize: 28, fontWeight: 'bold'}}>¥{price ? (price / 100).toFixed(2) : '0.00'}</p>

                        <div
                            style={{
                                width: 200,
                                height: 200,
                                margin: '0 auto',
                                border: '1px solid #ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {qrScanned ? (
                                <div style={{textAlign: 'center'}}>
                                    <img src="/check-circle.png" alt="Scanned" style={{width: 48, marginBottom: 8}}/>
                                    <p style={{color: '#1890ff'}}>Scanned</p>
                                </div>
                            ) : (
                                <img src="/wechat-qr-placeholder.png" alt="QR Code" style={{width: 180}}/>
                            )}
                        </div>

                        {!qrScanned && (
                            <Button type="primary" style={{marginTop: 16}} onClick={() => setQrScanned(true)}>
                                模拟扫码成功
                            </Button>
                        )}
                    </div>

                    {/* 右侧：微信扫码截图 */}
                    <div style={{transform: 'translateX(-150px)'}}>
                        <img src="/wechat-scan-demo.png" alt="WeChat Scan" style={{height: 400}}/>
                    </div>
                </div>
            </Modal>

            <Modal
                open={isPaymentFailedModalVisible}
                footer={null}
                onCancel={() => setIsPaymentFailedModalVisible(false)}
                zIndex={10900}
            >
                <Title level={4}>Payment Failed</Title>
                <p>Please finish your payment to continue.</p>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24}}>
                    <Button onClick={() => setIsPaymentFailedModalVisible(false)}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            setIsPaymentFailedModalVisible(false);
                            setStep(3); // 回到支付方式选择页面
                            setIsBookingModalVisible(true);
                        }}
                    >
                        Pay for the Session
                    </Button>
                </div>
            </Modal>

            {isMobile && showTrialTip && showFreeTrialBanner && (
                <div className={styles.trialTipFixed} role="note" aria-live="polite">
                    <span className={styles.trialTipIcon} aria-hidden>📣</span>
                    <span className={styles.trialTipText}>Book your free trial session!</span>
                    <button
                        type="button"
                        className={styles.trialTipClose}
                        aria-label="Dismiss"
                        onClick={() => setShowTrialTip(false)}
                    >
                        ×
                    </button>
                </div>
            )}
        </Layout>
    );
}
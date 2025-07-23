'use client';
import {
  Layout,
  Typography,
  Card,
  Tag,
  Avatar,
  Button,
  message,
  Modal,
  Select,
  Upload,
  Input,
} from 'antd';

import {
  LinkedinFilled,
  UserOutlined,
  DeleteOutlined,
  FileOutlined,
} from '@ant-design/icons';

import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from '@clerk/nextjs';

import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';
import NavBar from '../../components/Navbar';

import { isFreeCoffeeChat } from '../../services/constants';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MentorDetailsPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [supportType, setSupportType] = useState<string | null>(null);
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
  const [coffeeChatCount, setCoffeeChatCount] = useState<number>(0);

  // 👇 resume file list 渲染逻辑统一处理
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
      const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: 'short',
      });

      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart?.value || '';
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
        // const res = await fetch(`/api/coffee-chat-count/${user.id}`);
        const res = await fetch(`/api/user/${user.id}/get_coffee_chat_time`);
        const result = await res.json();
        if (res.ok) {
          setCoffeeChatCount(result.data); // 这是次数，例如 0 表示还没约
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id,
              fileName: `${Date.now()}_${resume?.name}`,
            }),
          });

          const { signedUrl, fileUrl, error } = await res.json();
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
        } catch (err) {
          console.error('AWS S3 resume upload failed:', err);
          message.error('Unexpected error uploading resume');
          return;
        }
      }

      try {
        const dateStr = selectedSlot?.date!;
        const timeStr = selectedSlot?.time!;
        // const [startTimeStr, endTimeStr] = timeStr.split(' - ');
        //
        // const start_time = new Date(`${dateStr} ${startTimeStr}`).toISOString();
        // const end_time = new Date(`${dateStr} ${endTimeStr}`).toISOString();
        // 临时为15分钟coffee chat设置的逻辑
        const [startTimeStr] = timeStr.split(' - ');
        const startTimeObj = dayjs(`${dateStr} ${startTimeStr}`, 'YYYY-MM-DD h:mm A');

        let endTimeObj: dayjs.Dayjs;

        if (isFreeCoffeeChat(supportType)) {
          endTimeObj = startTimeObj.add(15, 'minute');
        } else {
          const [, endTimeStr] = timeStr.split(' - ');
          endTimeObj = dayjs(`${dateStr} ${endTimeStr}`, 'YYYY-MM-DD h:mm A');
        }

        const start_time = startTimeObj.toISOString();
        const end_time = endTimeObj.toISOString();


        const calculatedPrice =
            mentor.services?.find((s: any) => s.type === supportType)?.price ?? 1500;

        const response = await fetch('/api/appointment/insert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mentor_id: mentor.user_id,
            mentee_id: user?.id,
            start_time,
            end_time,
            service_type: supportType,
            description,
            price: calculatedPrice,
          }),
        });

        const result = await response.json();

        if (result.code === -1) {
          if (result.message?.includes('Time slot is already booked')) {
            message.error('This time slot has already been booked. Please choose another.');
          } else {
            message.error(result.message || 'Failed to create appointment. Please try again.');
          }
          return;
        }

        if (!response.ok || result.error || !result.data?.appointment_id) {
          message.error('Failed to create appointment. Please try again.');
          return;
        }

        setAppointmentId(result.data.appointment_id);
        setPrice(calculatedPrice);
      } catch (err) {
        console.error('Error creating appointment:', err);
        message.error('Unexpected error');
        return;
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
        const type = typeof service === 'string' ? service : service.type;
        const isFreeChat = isFreeCoffeeChat(type);
        const usedUp = isFreeChat && coffeeChatCount > 0;

        return {
          value: type,
          label: (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{type}</span>
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

  if (mentorLoading) return <div style={{ padding: 24 }}>Loading mentor info...</div>;
  if (!mentor) return <div style={{ padding: 24 }}>Mentor not found.</div>;

  return (
      <Layout className={styles.layout}>
        <NavBar />
        <Content style={{ paddingTop: 88 }} className={styles.content}>
          {/* NavBar is fixed, so we add paddingTop to avoid overlap */}
          <div className={styles.container}>
            <div className={styles.mainContent}>
              <div className={styles.leftSection}>
                <div className={styles.profileHeader}>
                  <Avatar
                      size={120}
                      src={mentor.profile_url || undefined}
                      icon={!mentor.profile_url ? <UserOutlined /> : undefined}
                      style={{ background: '#f0f0f0' }}
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
                          <LinkedinFilled className={styles.socialIcon} />
                        </a>
                      </div>
                  )}
                </div>
                <Card className={styles.infoCard} title="Introduction" bordered>
                  Please introduce yourself to your future mentees.
                </Card>
                <Card className={styles.infoCard} title="Services" bordered>
                  <div className={styles.serviceTags}>
                    {Array.isArray(mentor.services) && mentor.services.length > 0 ? (
                        mentor.services.map((service: any, idx: number) => (
                            <Tag key={idx} className={styles.serviceTag}>
                              {service.type} - ${(service.price).toFixed(2)}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">This mentor has not listed any services.</Text>
                    )}
                  </div>
                </Card>

              </div>

              <div className={styles.rightSection}>
                <SignedIn>
                  <Title level={3} className={styles.availabilityHeader}>Mentor's Availability</Title>
                  <MentorAvailability
                      mentorId={mentor.user_id}
                      services={mentor.services || []}
                      onSlotSelect={(date, time) => setSelectedSlot({ date, time })}
                      onBook={() => {
                        setStep(2);
                        setIsBookingModalVisible(true);
                      }}
                  />

                </SignedIn>
                <SignedOut>
                  <Card>
                    <Title level={4}>Please sign in to book an appointment</Title>
                    <SignInButton mode="modal">
                      <Button type="primary">Sign In</Button>
                    </SignInButton>
                  </Card>
                </SignedOut>
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
                <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
                  Share the information below with the mentor.
                </p>

                {selectedSlot?.time && (
                    <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>
                      Session Time: {
                      isFreeCoffeeChat(supportType)
                          ? (() => {
                            const [start] = selectedSlot.time.split(' - ');
                            const startTime = dayjs(`2020-01-01 ${start}`, 'YYYY-MM-DD h:mm A');
                            const endTime = startTime.add(15, 'minute'); // 15分钟coffee chat的逻辑
                            return `${startTime.format('h:mm A')} - ${endTime.format('h:mm A')} ${userTzAbbr}`;
                          })()
                          : `${selectedSlot.time} ${userTzAbbr}`
                    }
                    </p>
                )}


                <p style={{ marginBottom: 8 }}>
                  <strong>
                    What kind of support are you looking for? <span style={{ color: 'red' }}>*</span>
                  </strong>
                </p>
                <Select
                    style={{ width: '100%', marginBottom: 16 }}
                    placeholder="Pick the topic you want to focus on."
                    options={supportTopicsOptions}
                    value={supportType}
                    onChange={setSupportType}
                />


                <p style={{ marginBottom: 8, marginTop: 24 }}><strong>Help your mentor understand you better</strong></p>
                <TextArea
                    rows={4}
                    placeholder="Share your goals, background, resume link, portfolio, or anything else that will help your mentor understand you better."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <p style={{ marginBottom: 8, marginTop: 24 }}><strong>Upload your resume (Optional)</strong></p>

                <div style={{
                  backgroundColor: '#fff',
                  border: 'none',
                  boxShadow: 'none',
                  borderRadius: 0,
                  padding: 0,
                }}>
                  {/* 顶部展示文件信息 */}
                  {resumeFileList.length > 0 && (
                      <div
                          style={{
                            border: '1px solid #d9d9d9',
                            borderBottom: 'none', // 关键！去掉底部边框以无缝连接下方上传框
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            padding: '12px 16px',
                            marginBottom: 0, // ✅ 紧贴上传框
                            backgroundColor: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileOutlined style={{ fontSize: 16 }} />
                          <a
                              href={resumeFileList[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 500 }}
                          >
                            {resumeFileList[0].name}
                          </a>
                          <span style={{ color: '#999', fontSize: 13 }}>
        {dayjs().format('MM/DD/YYYY')} Uploaded
      </span>
                        </div>
                        <DeleteOutlined
                            style={{ color: '#999', cursor: 'pointer' }}
                            onClick={async () => {
                              setResume(null);
                              setUserResume(null);

                              if (user?.id) {
                                await fetch('/api/user/update', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
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

                  {/* 拖拽上传框 */}
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
                      style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: 8 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                      <img src="/upload-icon.png" alt="upload" style={{ height: 32 }} />
                    </div>
                    <p className="ant-upload-text" style={{ fontWeight: 500, textAlign: 'center' }}>
                      Click or drag file to this area {resume || userResume ? 'to replace' : 'to upload'}
                    </p>
                    <p className="ant-upload-hint" style={{ textAlign: 'center' }}>
                      Please upload your resume here (<strong>PDF format only</strong>).<br />
                      Only one file is allowed. Uploading company-sensitive information or any prohibited files is strictly forbidden.
                    </p>

                  </Upload.Dragger>

                </div>
              </div>
          )}

          {step === 3 && (
              <div>
                <Title level={4} style={{ marginBottom: 28 }}>Payment Method</Title>
                <p style={{ marginBottom: 12 }}>Which way would you like to pay?</p>

                {/*/!* WeChat Pay Option *!/*/}
                {/*<div*/}
                {/*    style={{*/}
                {/*      border: selectedPaymentMethod === 'wechat' ? '2px solid #1890ff' : '1px solid #d9d9d9',*/}
                {/*      borderRadius: 8,*/}
                {/*      padding: '24px 20px',*/}
                {/*      marginBottom: 20,*/}
                {/*      minHeight: 80,*/}
                {/*      display: 'flex',*/}
                {/*      alignItems: 'center',*/}
                {/*      justifyContent: 'space-between',*/}
                {/*      cursor: 'pointer',*/}
                {/*      position: 'relative',*/}
                {/*      whiteSpace: 'nowrap',*/}
                {/*    }}*/}
                {/*    onClick={() => setSelectedPaymentMethod('wechat')}*/}
                {/*>*/}
                {/*  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>*/}
                {/*    <input*/}
                {/*        type="radio"*/}
                {/*        checked={selectedPaymentMethod === 'wechat'}*/}
                {/*        readOnly*/}
                {/*    />*/}
                {/*    <img src="/wechat-pay.png" alt="WeChat Pay" style={{ height: 24 }} />*/}
                {/*    <span style={{ fontSize: 16, color: '#1890ff', fontWeight: 500 }}>微信支付</span>*/}
                {/*  </div>*/}
                {/*  <div style={{ fontSize: 18, fontWeight: 600 }}>*/}
                {/*    ${price ? ((price / 100) * 0.98).toFixed(2) : '0.00'}*/}
                {/*  </div>*/}
                {/*  <div*/}
                {/*      style={{*/}
                {/*        position: 'absolute',*/}
                {/*        top: -10,*/}
                {/*        right: -10,*/}
                {/*        backgroundColor: '#ffc107',*/}
                {/*        color: '#000',*/}
                {/*        fontWeight: 600,*/}
                {/*        padding: '2px 6px',*/}
                {/*        fontSize: 12,*/}
                {/*        borderRadius: 4,*/}
                {/*      }}*/}
                {/*  >*/}
                {/*    Price 2% off*/}
                {/*  </div>*/}
                {/*</div>*/}

                {/* Stripe Option */}
                <div
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
                      position: 'relative',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => setSelectedPaymentMethod('stripe')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                        type="radio"
                        checked={selectedPaymentMethod === 'stripe'}
                        readOnly
                    />
                    <img src="/stripe-icon.png" alt="Stripe" style={{ height: 24 }} />
                    <span style={{ fontSize: 16, fontWeight: 500 }}>Pay in USD (U.S. Dollar)</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    ${price ? (price).toFixed(2) : '0.00'}
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button
                      type="primary"
                      onClick={() => {
                        if (!appointmentId || !price) {
                          message.error('Missing appointment ID or price');
                          return;
                        }
                        if (selectedPaymentMethod === 'stripe') {
                          setStep(4);
                          window.open(`/booking/payment?appointmentId=${appointmentId}&amount=${price}`, '_blank');
                        } else if (selectedPaymentMethod === 'wechat') {
                          setIsWeChatModalVisible(true);
                        }
                      }}
                  >
                    Pay for the Session
                  </Button>
                </div>
              </div>
          )}

          {step === 4 && (
              <div>
                <p>Jumping to the payment page...</p>
                <p>After finishing the payment it will lead you to the next step.</p>
              </div>
          )}

          {(step === 1 || step === 2) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button type="primary" onClick={handleNext}>Next</Button>
              </div>
          )}

        </Modal>

        <Modal
            open={isSuccessModalVisible}
            footer={null}
            onCancel={() => setIsSuccessModalVisible(false)}
        >
          <Title level={4}>Session Confirmed</Title>
          <p>Check your email for session details.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={() => setIsSuccessModalVisible(false)}>Stay On This Page</Button>
            <Button
                type="primary"
                onClick={() => window.location.href = `/mentee-profile/${user?.id}#sessions`}
            >
              View All My Booked Sessions
            </Button>
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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 左侧：二维码 */}
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>Payment</Title>
              <p style={{ fontSize: 16 }}>打开 <img src="/wechat-pay.png" alt="WeChat" style={{ height: 20, verticalAlign: 'middle' }} /> 微信扫一扫</p>
              <p style={{ fontSize: 28, fontWeight: 'bold' }}>¥{price ? (price / 100).toFixed(2) : '0.00'}</p>

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
                    <div style={{ textAlign: 'center' }}>
                      <img src="/check-circle.png" alt="Scanned" style={{ width: 48, marginBottom: 8 }} />
                      <p style={{ color: '#1890ff' }}>Scanned</p>
                    </div>
                ) : (
                    <img src="/wechat-qr-placeholder.png" alt="QR Code" style={{ width: 180 }} />
                )}
              </div>

              {!qrScanned && (
                  <Button type="primary" style={{ marginTop: 16 }} onClick={() => setQrScanned(true)}>
                    模拟扫码成功
                  </Button>
              )}
            </div>

            {/* 右侧：微信扫码截图 */}
            <div style={{ transform: 'translateX(-150px)' }}>
              <img src="/wechat-scan-demo.png" alt="WeChat Scan" style={{ height: 400 }} />
            </div>
          </div>
        </Modal>

        <Modal
            open={isPaymentFailedModalVisible}
            footer={null}
            onCancel={() => setIsPaymentFailedModalVisible(false)}
        >
          <Title level={4}>Payment Failed</Title>
          <p>Please finish your payment to continue.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
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

      </Layout>
  );
}

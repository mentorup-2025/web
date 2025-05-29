'use client';

import Link from 'next/link';
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
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { LinkedinFilled, UploadOutlined } from '@ant-design/icons';
import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useRouter, useParams } from 'next/navigation';

const { Header, Content } = Layout;
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

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const res = await fetch(`/api/user/${params.id}`);
        const result = await res.json();

        if (!res.ok || !result.data) {
          message.error('Failed to load mentor data');
          return;
        }

        setMentor(result.data);
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
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNext = async () => {
    if (step === 2) {
      let resumeUrl = null;

      if (resume) {
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

      let appointmentId = null;

      try {
        const dateStr = selectedSlot?.date!;
        const timeStr = selectedSlot?.time!;
        const [startTimeStr, endTimeStr] = timeStr.split(' - ');

        const start_time = new Date(`${dateStr} ${startTimeStr}`).toISOString();
        const end_time = new Date(`${dateStr} ${endTimeStr}`).toISOString();

        const servicePriceMap: Record<string, number> = {
          'Resume Review': 3000,
          'Interview Preparation': 4000,
          'Career Guidance': 5000,
        };

        const price = servicePriceMap[supportType ?? ''] ?? 1500;

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
            resume_url: resumeUrl,
            price,
          }),
        });

        const result = await response.json();

        if (response.status === 409) {
          message.error('This time slot has already been booked. Please choose another.');
          return;
        }

        if (!response.ok || result.error || !result.data?.appointment_id) {
          message.error('Failed to create appointment. Please try again.');
          return;
        }

        appointmentId = result.data.appointment_id;

        window.open(`/booking/payment?appointmentId=${appointmentId}&amount=${price}`, '_blank');
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

  const handleBecomeMentor = () => {
    if (!isSignedIn) return;
    router.push(`/signup-process/mentor/${user?.id}`);
  };

  if (mentorLoading) return <div style={{ padding: 24 }}>Loading mentor info...</div>;
  if (!mentor) return <div style={{ padding: 24 }}>Mentor not found.</div>;

  return (
      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.leftGroup}>
            <Link href="/" className={styles.logo}>MentorUp</Link>
            <Link href="/mentors" className={styles.link}>Our Mentors</Link>
          </div>
          <div className={styles.rightGroup}>
            <SignedOut>
              <SignInButton mode="modal">
                <Button type="primary" className={styles.becomeBtn}>Become a Mentor</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button type="primary" className={styles.becomeBtn} onClick={handleBecomeMentor}>
                Become a Mentor
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button type="default" style={{ marginLeft: '10px' }}>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </Header>

        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.mainContent}>
              <div className={styles.leftSection}>
                <div className={styles.profileHeader}>
                  <Avatar size={120} style={{ background: '#9b9b9b' }} />
                  <div className={styles.profileText}>
                    <Title level={2} className={styles.name}>{mentor.username}</Title>
                    <Text className={styles.jobTitle}>
                      {mentor.job_target?.title} @{mentor.job_target?.company}
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
                    {['Resume Review', 'Interview Preparation', 'Career Guidance'].map((service) => (
                        <Tag key={service} className={styles.serviceTag}>{service}</Tag>
                    ))}
                  </div>
                </Card>
              </div>

              <div className={styles.rightSection}>
                <SignedIn>
                  <Title level={3} className={styles.availabilityHeader}>Mentor's Availability</Title>
                  <MentorAvailability
                      mentorId={mentor.user_id}
                      onSlotSelect={(date, time) => setSelectedSlot({ date, time })}
                      onBook={() => setIsBookingModalVisible(true)}
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
            title={step === 1 ? 'Confirm Appointment' : step === 2 ? 'Share Info with Mentor' : 'Payment'}
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
                <p>What kind of support are you looking for?</p>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Pick the topic you want to focus on."
                    options={[
                      { value: 'Resume Review', label: 'Resume Review' },
                      { value: 'Interview Preparation', label: 'Interview Preparation' },
                      { value: 'Career Guidance', label: 'Career Guidance' },
                    ]}
                    value={supportType}
                    onChange={setSupportType}
                />

                <p style={{ marginTop: 16 }}>Help your mentor understand you better</p>
                <TextArea
                    rows={4}
                    placeholder="Share your goals, background, resume link, or anything else"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <p style={{ marginTop: 16 }}>Upload your resume (Optional)</p>
                <Upload
                    beforeUpload={(file) => {
                      setResume(file);
                      return false;
                    }}
                    fileList={resume ? [{
                      uid: '-1',
                      name: resume.name,
                      status: 'done',
                      url: URL.createObjectURL(resume),
                    }] : []}
                    onRemove={() => setResume(null)}
                    maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Click or drag file to upload</Button>
                </Upload>
              </div>
          )}

          {step === 3 && (
              <div>
                <p>Jumping to the payment page...</p>
                <p>After finishing the payment it will lead you to the next step.</p>
              </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button onClick={handleBack}>Back</Button>
            {step < 3 ? (
                <Button type="primary" onClick={handleNext}>Next</Button>
            ) : (
                <div style={{ textAlign: 'center' }}>
                  <p>Waiting for payment to complete...</p>
                  <p>You will be redirected after success.</p>
                </div>
            )}
          </div>
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
            <Button type="primary" onClick={() => window.location.href = '/my-sessions'}>
              View All My Booked Sessions
            </Button>
          </div>
        </Modal>
      </Layout>
  );
}

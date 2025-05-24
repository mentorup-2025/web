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

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MentorDetailsPage() {
  const { user, isSignedIn } = useUser();

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const [supportType, setSupportType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [resume, setResume] = useState<File | null>(null);

  const mentor = {
    name: 'Name Name',
    title: 'Job Title',
    company: 'company',
    linkedin: 'https://linkedin.com',
    introduction: 'Info comes from: Please introduce yourself to your future mentees.',
    services: ['Free Coffee Chat (15 mins)', 'Mock Interview', 'Resume Review'],
    user_id: '93137255-d7ac-4219-90d9-a886ae987732',
  };

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
        const response = await fetch('/api/booking/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mentorId: mentor.user_id,
            menteeId: user?.id,
            date: selectedSlot?.date,
            time: selectedSlot?.time,
            serviceType: supportType,
            description,
            resumeUrl,
          }),
        });

        const result = await response.json();

        if (response.status === 409) {
          message.error('This time slot has already been booked. Please choose another.');
          return;
        }

        if (!response.ok || result.error || !result.appointmentId) {
          message.error('Failed to create appointment. Please try again.');
          return;
        }


        appointmentId = result.appointmentId;
      } catch (err) {
        console.error('Error creating appointment:', err);
        message.error('Unexpected error');
        return;
      }

      sessionStorage.setItem(
          'bookingDetails',
          JSON.stringify({
            mentorId: mentor.user_id,
            menteeId: user?.id,
            date: selectedSlot?.date,
            time: selectedSlot?.time,
            serviceType: supportType,
            description,
            resumeUrl,
            appointmentId,
          })
      );

      window.open('/booking/payment', '_blank');
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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'paymentSuccess') {
        const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');
        const appointmentId = bookingDetails.appointmentId;

        if (!appointmentId) {
          console.error('❌ Missing appointmentId in sessionStorage');
          return;
        }

        try {
          const res = await fetch('/api/booking/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId }),
          });

          const result = await res.json();
          if (!res.ok) {
            console.error('❌ Confirm failed:', result);
            return;
          }

          setIsSuccessModalVisible(true);
          setIsBookingModalVisible(false);
          setStep(1);
        } catch (err) {
          console.error('❌ Error calling confirm API:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  return (
      <Layout className={styles.layout}>
        <Header className={styles.header}>
          <div className={styles.leftGroup}>
            <Link href="/" className={styles.logo}>MentorUp</Link>
            <Link href="/mentors" className={styles.link}>Our Mentors</Link>
          </div>
          <div className={styles.rightGroup}>
            <Link href="/become-mentor">
              <Button type="primary" className={styles.becomeBtn}>Become a Mentor</Button>
            </Link>
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
                    <Title level={2} className={styles.name}>{mentor.name}</Title>
                    <Text className={styles.jobTitle}>{mentor.title} @{mentor.company}</Text>
                  </div>
                  <div className={styles.socialIconWrapper}>
                    <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedinFilled className={styles.socialIcon} />
                    </a>
                  </div>
                </div>
                <Card className={styles.infoCard} title="Introduction" bordered>
                  {mentor.introduction}
                </Card>
                <Card className={styles.infoCard} title="Services" bordered>
                  <div className={styles.serviceTags}>
                    {mentor.services.map((service) => (
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
                <p>You are booking a session with {mentor.name} on:</p>
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
                      url: URL.createObjectURL(resume)
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

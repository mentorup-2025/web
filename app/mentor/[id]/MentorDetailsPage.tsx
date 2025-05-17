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
import { useState } from 'react';
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

  const handleFinalSubmit = async () => {
    if (!selectedSlot || !isSignedIn || !user) return;

    setLoading(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress || '';
      const username = email.split('@')[0];

      await supabase.from('users').upsert([{ user_id: user.id, email, username }], {
        onConflict: 'user_id',
      });

      const [startTimeStr, endTimeStr] = selectedSlot.time.split(' - ');
      const startDateTime = `${selectedSlot.date} ${startTimeStr}`;
      const endDateTime = `${selectedSlot.date} ${endTimeStr}`;

      let resumeUrl = null;
      if (resume) {
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(`${user.id}/${Date.now()}_${resume.name}`, resume);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
            .from('resumes')
            .getPublicUrl(uploadData.path);
        resumeUrl = publicUrl.publicUrl;
      }

      const { error: insertError } = await supabase.from('appointments').insert([
        {
          mentor_id: mentor.user_id,
          mentee_id: user.id,
          time_slot: [startDateTime, endDateTime],
          status: 'pending',
          service_type: supportType || 'Mock Interview',
          price: 0,
          extra_info: description,
          resume_url: resumeUrl,
        },
      ]);

      if (insertError) throw insertError;

      setIsBookingModalVisible(false);
      setIsSuccessModalVisible(true);
      setStep(1);
      setSupportType(null);
      setDescription('');
      setResume(null);
    } catch (error) {
      console.error('Booking failed:', error);
      message.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
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
                    fileList={resume ? [resume] : []}
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
                <Button type="primary" loading={loading} onClick={handleFinalSubmit}>
                  I have finished the payment
                </Button>
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

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
} from 'antd';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { LinkedinFilled } from '@ant-design/icons';
import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';
import { useState } from 'react';
import { supabase } from '../../services/supabase';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function MentorDetailsPage() {
  const { user, isSignedIn } = useUser();

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const mentor = {
    name: 'Name Name',
    title: 'Job Title',
    company: 'company',
    linkedin: 'https://linkedin.com',
    introduction:
        'Info comes from: Please introduce yourself to your future mentees.',
    services: ['Free Coffee Chat (15 mins)', 'Mock Interview', 'Resume Review'],
    user_id: '93137255-d7ac-4219-90d9-a886ae987732',
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !isSignedIn || !user) {
      message.error('Please select a time slot and make sure you are logged in');
      return;
    }

    setLoading(true);
    try {
      const [startTimeStr, endTimeStr] = selectedSlot.time.split(' - ');
      const startDateTime = `${selectedSlot.date} ${startTimeStr}`;
      const endDateTime = `${selectedSlot.date} ${endTimeStr}`;

      const { data, error } = await supabase
          .from('appointments')
          .insert([
            {
              mentor_id: mentor.user_id,
              mentee_id: user.id,
              time_slot: `[${startDateTime}, ${endDateTime})`,
              status: 'pending',
              service_type: 'Mock Interview',
              price: 0,
            },
          ])
          .select();

      if (error) throw error;

      message.success('Appointment booked successfully!');
      setIsBookingModalVisible(false);
    } catch (error) {
      console.error('Booking failed:', error);
      message.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
      <Layout>
        {/* ---------------- 顶部导航栏 ---------------- */}
        <Header className={styles.header}>
          <div className={styles.leftGroup}>
            <Link href="/" className={styles.logo}>
              MentorUp
            </Link>
            <Link href="/mentors" className={styles.link}>
              Our Mentors
            </Link>
          </div>

          <div className={styles.rightGroup}>
            <Link href="/become-mentor">
              <Button type="primary" className={styles.becomeBtn}>
                Become a Mentor
              </Button>
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <Button type="default" style={{ marginLeft: '1rem' }}>
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </Header>

        {/* ---------------- 页面主体 ---------------- */}
        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.mainContent}>
              {/* 左列：导师信息 */}
              <div className={styles.leftSection}>
                <div className={styles.profileHeader}>
                  <Avatar size={120} style={{ background: '#9b9b9b' }} />

                  <div className={styles.profileText}>
                    <Title level={2} className={styles.name}>
                      {mentor.name}
                    </Title>
                    <Text className={styles.jobTitle}>
                      {mentor.title} @{mentor.company}
                    </Text>
                  </div>

                  <div className={styles.socialIconWrapper}>
                    <a
                        href={mentor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                      <LinkedinFilled className={styles.socialIcon} />
                    </a>
                  </div>
                </div>

                <Card
                    className={styles.infoCard}
                    title={<span className={styles.cardTitle}>Introduction</span>}
                    bordered
                >
                  {mentor.introduction}
                </Card>

                <Card
                    className={styles.infoCard}
                    title={<span className={styles.cardTitle}>Services</span>}
                    bordered
                >
                  <div className={styles.serviceTags}>
                    {mentor.services.map((service) => (
                        <Tag key={service} className={styles.serviceTag}>
                          {service}
                        </Tag>
                    ))}
                  </div>
                </Card>
              </div>

              {/* 右列：导师预约 */}
              <div className={styles.rightSection}>
                <SignedIn>
                  <Title level={3} className={styles.availabilityHeader}>
                    Mentor's Availability
                  </Title>

                  <MentorAvailability
                      key={isSignedIn ? 'signedIn' : 'signedOut'} // ✅ 强制刷新组件
                      mentorId={mentor.user_id}
                      onSlotSelect={(date, time) => {
                        setSelectedSlot({ date, time });
                      }}
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

        {/* ---------------- 预约确认模态框 ---------------- */}
        <Modal
            title="Confirm Appointment"
            open={isBookingModalVisible}
            onOk={handleBookAppointment}
            onCancel={() => setIsBookingModalVisible(false)}
            confirmLoading={loading}
            okText="Confirm Booking"
        >
          {selectedSlot && (
              <div>
                <p>You are booking a session with {mentor.name} on:</p>
                <p>
                  <strong>Date:</strong> {selectedSlot.date}
                </p>
                <p>
                  <strong>Time:</strong> {selectedSlot.time}
                </p>
                <p>
                  <strong>Service:</strong> Mock Interview
                </p>
              </div>
          )}
        </Modal>
      </Layout>
  );
}

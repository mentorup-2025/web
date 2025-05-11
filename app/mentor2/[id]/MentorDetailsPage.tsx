'use client';

import Link from 'next/link';
import {
  Layout,
  Typography,
  Card,
  Tag,
  Avatar,
  Button,
  Dropdown,
  MenuProps,
  message,
  Modal,
} from 'antd';
import { LinkedinFilled, UserOutlined } from '@ant-design/icons';
import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';
import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useUser } from '../../context/UserContext';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function MentorDetailsPage() {
  const { user } = useUser(); // 假设你有一个用户上下文
  console.log('Current user:', user); // 检查是否为空
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // ▼ 假数据 – 后续替换为真实接口
  const mentor = {
    name: 'Name Name',
    title: 'Job Title',
    company: 'company',
    linkedin: 'https://linkedin.com',
    introduction:
        'Info comes from: Please introduce yourself to your future mentees.',
    services: [
      'Free Coffee Chat (15 mins)',
      'Mock Interview',
      'Resume Review',
    ],
    user_id: '93137255-d7ac-4219-90d9-a886ae987732',
  };

  // ▼ 用户菜单占位
  const menuItems: MenuProps['items'] = [
    { key: '1', label: <Link href="/profile">Profile</Link> },
    { key: '2', label: <Link href="/logout">Log out</Link> },
  ];

  const handleSlotSelect = (date: string, time: string) => {
    console.log('Received slot:', date, time); // 调试
    setSelectedSlot({ date, time });
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !user) {
      message.error('Please select a time slot and make sure you are logged in');
      return;
    }

    setLoading(true);

    try {
      // 解析时间段
      const [startTimeStr, endTimeStr] = selectedSlot.time.split(' - ');
      const startDateTime = `${selectedSlot.date} ${startTimeStr}`;
      const endDateTime = `${selectedSlot.date} ${endTimeStr}`;

      // 创建预约记录
      const { data, error } = await supabase
          .from('appointments')
          .insert([
            {
              mentor_id: mentor.user_id,
              mentee_id: user.id, // 假设用户上下文中有用户ID
              time_slot: `[${startDateTime}, ${endDateTime})`,
              status: 'pending',
              service_type: 'Mock Interview', // 可以从服务列表中选择
              price: 0, // 免费服务设为0，或从服务中获取价格
            },
          ])
          .select();

      if (error) {
        throw error;
      }

      message.success('Appointment booked successfully!');
      setIsBookingModalVisible(false);
      // 这里可以添加重定向到确认页面或其他逻辑
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
              Our Mentors
            </Link>
          </div>

          <div className={styles.rightGroup}>
            <Link href="/become-mentor">
              <Button type="primary" className={styles.becomeBtn}>
                Become a Mentor
              </Button>
            </Link>

            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
              <Avatar size="large" icon={<UserOutlined />} className={styles.avatar} />
            </Dropdown>
          </div>
        </Header>

        {/* ---------------- 页面主体 ---------------- */}
        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.mainContent}>
              {/* 左列 2/3 */}
              <div className={styles.leftSection}>
                {/* 个人资料行 */}
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

                {/* 介绍卡片 */}
                <Card
                    className={styles.infoCard}
                    title={<span className={styles.cardTitle}>Introduction</span>}
                    bordered
                >
                  {mentor.introduction}
                </Card>

                {/* Services 卡片 */}
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

              {/* 右列 1/3 */}
              <div className={styles.rightSection}>
                <Title level={3} className={styles.availabilityHeader}>
                  Mentor's Availability
                </Title>

                <MentorAvailability
                    mentorId={mentor.user_id}
                    onSlotSelect={(date, time) => {
                      console.log('Selected:', date, time); // 测试回调
                      setSelectedSlot({ date, time });
                    }}
                    onBook={() => setIsBookingModalVisible(true)}
                />
              </div>
            </div>
          </div>
        </Content>

        {/* 预约确认模态框 */}
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
                <p><strong>Date:</strong> {selectedSlot.date}</p>
                <p><strong>Time:</strong> {selectedSlot.time}</p>
                <p><strong>Service:</strong> Mock Interview</p>
              </div>
          )}
        </Modal>
      </Layout>
  );
}
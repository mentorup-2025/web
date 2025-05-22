'use client';

import { Layout, Tabs, Avatar, Typography, Space, Card, Tag } from 'antd';
import { LinkedinFilled, GithubOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import AvailabilityTab from '../components/AvailabilityTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../mentorProfile.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface MentorData {
  user_id: string;
  username: string;
  email: string;
  github: string | null;
  linkedin: string | null;
  mentor: {
    title: string;
    company: string;
    introduction: string;
    years_of_experience: number;
    services: Array<{
      type: string;
      price: number;
    }>;
  };
}

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params?.id as string;
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('about');

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    const fetchMentorData = async () => {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/${params.id}`);
        const result = await response.json();
        if (result.code === 200) {
          setMentorData(result.data);
        }
      } catch (error) {
        console.error('Error fetching mentor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [params?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!mentorData) {
    return <div>Mentor not found</div>;
  }

  const formatServiceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `#${key}`);
  };

  return (
    <Layout>
      <Navbar />
      <Content className={styles.content}>
        <div className={styles.container}>
          {/* Profile Header Section */}
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <Avatar 
                size={120}
                src="/placeholder-avatar.png"
                className={styles.avatar}
              />
              <div className={styles.profileText}>
                <Title level={2}>{mentorData.username}</Title>
                <Text className={styles.title}>
                  {mentorData.mentor.title} @ {mentorData.mentor.company}
                </Text>
                <Space className={styles.socialLinks}>
                  {mentorData.linkedin && (
                    <a href={mentorData.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedinFilled className={styles.socialIcon} />
                    </a>
                  )}
                  {mentorData.github && (
                    <a href={mentorData.github} target="_blank" rel="noopener noreferrer">
                      <GithubOutlined className={styles.socialIcon} />
                    </a>
                  )}
                </Space>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="About Me" key="about">
              <div className={styles.tabContent}>
                {/* Info Cards */}
                <div className={styles.section}>
                  <div className={styles.infoCards}>
                    <Card title="Introduction" className={styles.infoCard}>
                      {mentorData.mentor.introduction}
                    </Card>
                    <Card title="Experience" className={styles.infoCard}>
                      {mentorData.mentor.years_of_experience} years
                    </Card>
                  </div>
                </div>

                {/* Services Section */}
                <div className={styles.servicesSection}>
                  <Title level={3}>Services</Title>
                  <div className={styles.serviceTags}>
                    {mentorData.mentor.services.map(service => (
                      <Tag key={service.type} className={styles.serviceTag}>
                        {formatServiceType(service.type)} - ${service.price}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="My Sessions" key="sessions">
              <MySessionsTab />
            </TabPane>

            <TabPane tab="Availability" key="availability">
                <AvailabilityTab userId={mentorId} />
            </TabPane>
            
            <TabPane tab="Payment & Invoices" key="payments">
              <PaymentTab />
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
}

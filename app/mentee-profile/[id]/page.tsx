'use client';

import { Layout, Tabs, Avatar, Typography, Space, Card, Tag, Alert } from 'antd';
import { LinkedinFilled, GithubOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../menteeProfile.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface UserData {
  user_id: string;
  username: string;
  email: string;
  created_at: string;
  github: string | null;
  linkedin: string | null;
  resume: string | null;
  industries: string[];
  wechat: string | null;
  status: string | null;
  job_target: string | null;
  mentee?: {
    interests?: string[];
    career_goals?: string;
    introduction?: string;
    education?: string;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  data: UserData;
}

export default function MenteeProfilePage() {
  const params = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('about');

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!params?.id) {
        setLoading(false);
        setError('User ID not provided');
        return;
      }

      try {
        const response = await fetch(`/api/user/${params.id}`);
        const result: ApiResponse = await response.json();
        
        if (result.code === 200) {
          setUserData(result.data);
        } else {
          setError(result.message || 'Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!userData) {
    return <Alert message="User not found" description="The requested user profile could not be found" type="warning" showIcon />;
  }

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
                <Title level={2}>{userData.username}</Title>
                <Text className={styles.title}>
                  {userData.job_target || 'No job target specified'}
                </Text>
                <Space className={styles.socialLinks}>
                  {userData.linkedin && (
                    <a href={userData.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedinFilled className={styles.socialIcon} />
                    </a>
                  )}
                  {userData.github && (
                    <a href={userData.github} target="_blank" rel="noopener noreferrer">
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
                    <Card title="User Information" className={styles.infoCard}>
                      <p><strong>Email:</strong> {userData.email}</p>
                      <p><strong>Member Since:</strong> {new Date(userData.created_at).toLocaleDateString()}</p>
                      {userData.mentee?.introduction && (
                        <p><strong>Introduction:</strong> {userData.mentee.introduction}</p>
                      )}
                      {userData.mentee?.career_goals && (
                        <p><strong>Career Goals:</strong> {userData.mentee.career_goals}</p>
                      )}
                      {userData.resume && (
                        <p><strong>Resume:</strong> <a href={userData.resume} target="_blank" rel="noopener noreferrer">View Resume</a></p>
                      )}
                    </Card>
                  </div>
                </div>

                {/* Interests/Industries Section */}
                <div className={styles.interestsSection}>
                  <Title level={3}>Industries & Interests</Title>
                  <div className={styles.interestTags}>
                    {userData.industries && userData.industries.length > 0 ? (
                      userData.industries.map(industry => (
                        <Tag key={industry} className={styles.interestTag}>
                          {industry}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">No industries specified</Text>
                    )}
                    
                    {userData.mentee?.interests && userData.mentee.interests.length > 0 && (
                      userData.mentee.interests.map(interest => (
                        <Tag key={interest} className={styles.interestTag}>
                          {interest}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="My Sessions" key="sessions">
              <MySessionsTab />
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
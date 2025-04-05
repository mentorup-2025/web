'use client';

import { Layout, Tabs, Avatar, Typography, Space, Card, Tag } from 'antd';
import { LinkedinFilled, GithubOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import styles from './mentorProfile.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function MentorProfilePage() {
  // Mock data - replace with real data later
  const mentor = {
    name: 'John Doe',
    title: 'SDE',
    company: 'Amazon',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    introduction: 'Senior Software Engineer with 8+ years of experience in full-stack development. Passionate about mentoring and helping others grow in their tech careers.',
    industry: 'Technology, E-commerce',
    yearsOfExperience: 8,
    services: ['Resume Review', 'Mock Interview', 'Career Guidance', 'System Design', 'Coding Interview']
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
                src="/placeholder-avatar.png" // Add your placeholder image
                className={styles.avatar}
              />
              <div className={styles.profileText}>
                <Title level={2}>John Doe</Title>
                <Text className={styles.title}>Senior Software Engineer @ Google</Text>
                <Space className={styles.socialLinks}>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <LinkedinFilled className={styles.socialIcon} />
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <GithubOutlined className={styles.socialIcon} />
                  </a>
                </Space>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultActiveKey="about">
            <TabPane tab="About Me" key="about">
              <div className={styles.tabContent}>

                {/* Info Cards */}
                <div className={styles.section}>
                  <div className={styles.infoCards}>
                    <Card title="Introduction" className={styles.infoCard}>
                      {mentor.introduction}
                    </Card>
                    <Card title="Industry" className={styles.infoCard}>
                      {mentor.industry}
                    </Card>
                    <Card title="Years of Experience" className={styles.infoCard}>
                      {mentor.yearsOfExperience} years
                    </Card>
                  </div>
                </div>

                {/* Services Section */}
                <div className={styles.servicesSection}>
                  <Title level={3}>Services</Title>
                  <div className={styles.serviceTags}>
                    {mentor.services.map(service => (
                      <Tag key={service} className={styles.serviceTag}>
                        {service}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="My Sessions" key="sessions">
              <div className={styles.tabContent}>
                <p>My Sessions content placeholder...</p>
              </div>
            </TabPane>
            
            <TabPane tab="Payment & Invoices" key="payments">
              <div className={styles.tabContent}>
                <p>Payment & Invoices content placeholder...</p>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
} 
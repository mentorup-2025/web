'use client';

import { Layout, Typography, Card, Tag } from 'antd';
import { LinkedinFilled, GithubOutlined } from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function MentorDetailsPage() {
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
    services: ['Resume Review', 'Mock Interview', 'Career Guidance', 'System Design', 'Coding Interview'],
    user_id: '93137255-d7ac-4219-90d9-a886ae987732'
  };

  return (
    <Layout>
      <Navbar />
      <Content className={styles.content}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            {/* Left Section - 2/3 width */}
            <div className={styles.leftSection}>
              {/* Section 1: Profile */}
              <div className={styles.section}>
                <div className={styles.profileSection}>
                  <div className={styles.profileHeader}>
                    <Title level={2}>{mentor.name}</Title>
                    <div className={styles.socialLinks}>
                      <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer">
                        <LinkedinFilled className={styles.socialIcon} />
                      </a>
                      <a href={mentor.github} target="_blank" rel="noopener noreferrer">
                        <GithubOutlined className={styles.socialIcon} />
                      </a>
                    </div>
                  </div>
                  <Text className={styles.jobTitle}>
                    {mentor.title} @ {mentor.company}
                  </Text>
                </div>
              </div>

              {/* Section 2: Info Cards */}
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

              {/* Section 3: Services */}
              <div className={styles.section}>
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
            </div>

            {/* Right Section - 1/3 width */}
            <div className={styles.rightSection}>
              <MentorAvailability mentorId={mentor.user_id} />
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
} 
'use client';

import { Layout, Typography, Card, Avatar } from 'antd';
import {
  LinkedinFilled,
  GithubOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import styles from './mentorDetails.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function MentorDetailsPage() {
  // TODO: 替换为真实接口数据
  const mentor = {
    name: 'Name Name',
    title: 'Job Title',
    company: 'company',
    linkedin: 'https://linkedin.com/in/demo',
    github: '',
    introduction:
        'Info comes from: Please introduce yourself to your future mentees.',
    services: [
      'Free Coffee Chat (15 mins)',
      'Mock Interview',
      'Resume Review',
    ],
    user_id: '93137255-d7ac-4219-90d9-a886ae987732',
  };

  return (
      <Layout>
        <Navbar />
        <Content className={styles.content}>
          <div className={styles.mainContent}>
            {/* ---------- 左侧 ---------- */}
            <div className={styles.leftSection}>
              {/* 头像 + 基本信息 */}
              <div className={styles.profileRow}>
                <Avatar
                    size={96}
                    icon={<UserOutlined />}
                    className={styles.avatar}
                />
                <div className={styles.nameBlock}>
                  <Title level={3} className={styles.name}>
                    {mentor.name}
                  </Title>
                  <Text className={styles.jobTitle}>
                    {mentor.title} @{mentor.company}
                  </Text>
                </div>
                <div className={styles.socialLinks}>
                  {mentor.linkedin && (
                      <a
                          href={mentor.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                        <LinkedinFilled className={styles.socialIcon} />
                      </a>
                  )}
                  {mentor.github && (
                      <a
                          href={mentor.github}
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                        <GithubOutlined className={styles.socialIcon} />
                      </a>
                  )}
                </div>
              </div>

              {/* Introduction */}
              <Card title="Introduction" className={styles.infoCard}>
                {mentor.introduction}
              </Card>

              {/* Services */}
              <Card title="Services" className={styles.infoCard}>
                {mentor.services.join(', ')}
              </Card>
            </div>

            {/* ---------- 右侧 ---------- */}
            <div className={styles.rightSection}>
              <h2 className={styles.availabilityTitle}>Mentor’s Availability</h2>
              {/* 把日历&时段逻辑放在组件里 */}
              {/*
              <MentorAvailability mentorId={mentor.user_id} />
             */}
            </div>
          </div>
        </Content>
      </Layout>
  );
}

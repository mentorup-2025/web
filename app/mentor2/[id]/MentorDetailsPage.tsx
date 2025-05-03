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
} from 'antd';
import { LinkedinFilled, UserOutlined } from '@ant-design/icons';
import styles from './mentorDetails.module.css';
import MentorAvailability from '../../components/MentorAvailability';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function MentorDetailsPage() {
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
              {/* -------- 左列 2/3 -------- */}
              <div className={styles.leftSection}>
                {/* 1️⃣ 个人资料行 */}
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

                {/* 2️⃣ 介绍卡片 */}
                <Card
                    className={styles.infoCard}
                    title={<span className={styles.cardTitle}>Introduction</span>}
                    bordered
                >
                  {mentor.introduction}
                </Card>

                {/* 3️⃣ Services 卡片 */}
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

              {/* -------- 右列 1/3 -------- */}
              <div className={styles.rightSection}>
                <Title level={3} className={styles.availabilityHeader}>
                  Mentor’s Availability
                </Title>

                <MentorAvailability mentorId={mentor.user_id} />
              </div>
            </div>
          </div>
        </Content>
      </Layout>
  );
}
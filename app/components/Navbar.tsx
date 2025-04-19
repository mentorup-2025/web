'use client';

import { Layout, Input, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';

const { Header } = Layout;
const { Search } = Input;

export default function Navbar() {
  const router = useRouter();

  const userMenuItems = [
    {
      key: 'edit',
      label: 'Edit Profile'
    },
    {
      key: 'logout',
      label: 'Logout'
    }
  ];

  return (
    <Header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <h1 
            className={styles.logo}
            onClick={() => router.push('/')}
            style={{ cursor: 'pointer' }}
          >
            MentorUp
          </h1>
        </div>

        <div className={styles.headerRight}>
          <Space>
            <Link href="/login">
              <Button type="text">Login</Button>
            </Link>
            <Link href="/signup">
              <Button type="primary">Sign Up</Button>
            </Link>
          </Space>
          
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              className={styles.userAvatar}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      </div>
    </Header>
  );
} 
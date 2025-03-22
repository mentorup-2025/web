'use client';

import { Layout, Input, Button, Dropdown, Avatar } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import Image from 'next/image';
import styles from '../search.module.css';

const { Header } = Layout;
const { Search } = Input;

export default function Navbar() {
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
          <Image 
            src="/logo.png" 
            alt="MentorUp Logo" 
            width={120} 
            height={40} 
            className={styles.logo}
          />
          
          <Search
            placeholder="Search mentors..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            className={styles.searchBar}
          />
        </div>

        <div className={styles.headerRight}>
          <Button type="primary" size="large">
            Become a Mentor
          </Button>
          
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
'use client';

import { Layout, Input, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

const { Header } = Layout;
const { Search } = Input;

export default function Navbar() {
  const router = useRouter();

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
            <SignedOut>
              <SignInButton mode="modal">
                <Button type="text">Login</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button type="primary">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </Space>
        </div>
      </div>
    </Header>
  );
} 
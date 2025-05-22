'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button, Layout, Space } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';

const { Header } = Layout;


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
              {' '}
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
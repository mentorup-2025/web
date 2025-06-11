'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button, Layout, Space } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';
import { useState, useEffect } from 'react';

const { Header } = Layout;

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const [isMentor, setIsMentor] = useState<boolean | null>(true);

  useEffect(() => {
    const checkMentorStatus = async () => {
      if (user?.id) {
        // console.log('user?.id', user?.id);
        try {
          const response = await fetch(`/api/user/${user.id}`);
          const data = await response.json();
          setIsMentor(data.data.mentor !== null);
        } catch (error) {
          console.error('Error checking mentor status:', error);
        }
      }
    };

    checkMentorStatus();
  }, [user?.id]);

  const handleBecomeMentor = () => {
    router.push('/signup-process/mentor/' + user?.id);
  };

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

        <Space className={styles.headerRight}> 
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
            {isMentor === false && (
              <Button 
                type="primary" 
                onClick={handleBecomeMentor}
              >
                Become a Mentor
              </Button>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </Space>
      </div>
    </Header>
  );
} 
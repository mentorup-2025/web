'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser, useClerk } from '@clerk/nextjs';
import { Button, Layout, Space } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';
import { useState, useEffect, useRef } from 'react';

const { Header } = Layout;

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMentor, setIsMentor] = useState<boolean | null>(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('user', user);

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
    router.push('/signup/mentor/' + user?.id);
  };

  if (!user) return null;

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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img
                  src={user.imageUrl}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <span>{user.firstName}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  <a href={`/mentee-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentee Profile</a>
                  {isMentor && <a href={`/mentor-profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">Mentor Profile</a>}
                 
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </SignedIn>
        </Space>
      </div>
    </Header>
  );
} 
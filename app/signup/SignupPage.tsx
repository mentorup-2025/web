'use client';

import { Typography } from 'antd';
import { SignUp, useSignUp } from '@clerk/nextjs';
import styles from '../login/login.module.css';
import { useRouter } from 'next/navigation';
import { CreateUserInput, UserStatus } from '../types/user';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function SignupPage() {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    const handleSignUp = async () => {
      if (
        signUp.status === 'complete' && 
        signUp.emailAddress &&
        signUp.firstName &&
        signUp.lastName &&
        signUp.createdUserId
      ) {
        try {
          const userData: CreateUserInput = {
            user_id: signUp.createdUserId,
            username: `${signUp.firstName} ${signUp.lastName}`,
            email: signUp.emailAddress,
          };

          const response = await fetch('/api/user/insert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user');
          }

          router.push('/dashboard');
        } catch (error) {
          console.error('Error:', error);
          // Show error to user (consider adding state for error messages)
        }
      }
    };

    handleSignUp();
  }, [isLoaded, signUp, router]);

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className="flex flex-col gap-4 items-center">
        <SignUp 
          routing="hash"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              card: 'shadow-none',
              headerTitle: 'text-2xl font-bold',
              headerSubtitle: 'text-gray-500',
              formFieldLabel: 'text-gray-700',
              formFieldInput: 'border-gray-300',
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              footerActionLink: 'text-blue-600 hover:text-blue-700'
            }
          }}
        />
      </div>
    </div>
  );
} 
'use client';

import { Typography } from 'antd';
import { SignIn } from '@clerk/nextjs';
import styles from './login.module.css';

const { Title, Text } = Typography;

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

          <div className="flex flex-col gap-4 items-center">
            <SignIn 
              routing="hash"
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
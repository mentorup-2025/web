'use client';

import { Button, Form, Input, Typography, Divider } from 'antd';
import Image from 'next/image';
import styles from './signup.module.css';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.formSection}>
        <div className={styles.signupForm}>
          <Text>Welcome!</Text>
          <Title level={2} style={{ marginTop: 8, marginBottom: 24 }}>
            Create your MentorUp Account
          </Title>

          <Form layout="vertical">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input placeholder="Enter your email" size="large" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 8, message: 'Password must be at least 8 characters!' }
              ]}
            >
              <Input.Password placeholder="Create a password" size="large" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your password" size="large" />
            </Form.Item>

            <Button type="primary" block size="large" className={styles.registerButton}>
              Register
            </Button>

            <Divider plain>Or</Divider>

            <Button 
              block 
              size="large"
              className={styles.googleButton}
            >
              <Image 
                src="/google-icon.png" 
                alt="Google" 
                width={20} 
                height={20} 
                className={styles.googleIcon}
              />
              Sign up with Google
            </Button>

            <div className={styles.loginSection}>
              <Text>Already have an account? </Text>
              <Link href="/login" className={styles.loginLink}>
                LOG IN HERE
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
} 
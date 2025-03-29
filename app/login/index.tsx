"use client";
import { Button, Checkbox, Form, Input, Typography, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import styles from './login.module.css';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.loginForm}>
        <Text>Welcome back!</Text>
        <Title level={2} style={{ marginTop: 8, marginBottom: 24 }}>
          Log In to MentorUp
        </Title>

        <Form layout="vertical">
          <Form.Item
            label="User name/Email"
            name="username"
          >
            <Input placeholder="Input your user account" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            // validateStatus="error"
            // help="Incorrect user name or Password"
          >
            <Input.Password placeholder="Input your password" size="large" />
          </Form.Item>

          <div className={styles.rememberForgot}>
            <Checkbox>Remember me</Checkbox>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </Link>
          </div>

          <Button type="primary" block size="large" className={styles.loginButton}>
            Login
          </Button>

          <Divider plain>Or</Divider>

          <Button 
            icon={<GoogleOutlined />}
            block 
            size="large"
            className={styles.googleButton}
          >
            Sign in with Google
          </Button>

          <div className={styles.signupSection}>
            <Text>New User? </Text>
            <Link href="/signup" className={styles.signupLink}>
              SIGN UP HERE
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
'use client';

import { Button, Typography, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import styles from './email-verification.module.css';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

export default function EmailVerificationPage() {
  const [countdown, setCountdown] = useState(60);
  const [isCountingDown, setIsCountingDown] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsCountingDown(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountingDown]);

  const handleResend = () => {
    // Add your resend logic here
    setCountdown(60);
    setIsCountingDown(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.verificationForm}>
          <Title level={2} style={{ marginBottom: 32 }}>
            Email Verification
          </Title>

          <div className={styles.messageBox}>
            <Text className={styles.verificationText}>
              We have sent an email to
            </Text>
            <Text strong className={styles.emailText}>
              xxxxxxxxxx@xxxx.com
            </Text>
            <Text className={styles.verificationText}>
              please check and verify
            </Text>
          </div>

          <Button 
            type="primary" 
            block 
            size="large" 
            className={styles.verifyButton}
          >
            I have verified and continue
          </Button>

          <div className={styles.resendSection}>
            <Text className={styles.resendText}>
              Didn't receive it?{' '}
              {isCountingDown ? (
                <span>After {countdown}s Resend</span>
              ) : (
                <Button 
                  type="link" 
                  className={styles.resendButton} 
                  onClick={handleResend}
                >
                  Resend
                </Button>
              )}
            </Text>
          </div>

          <Divider plain>Or</Divider>

          <Button 
            icon={<GoogleOutlined />}
            block 
            size="large"
            className={styles.googleButton}
          >
            Sign up with Google
          </Button>
        </div>
      </div>
      <div className={styles.rightSection}></div>
    </div>
  );
} 
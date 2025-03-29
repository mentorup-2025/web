'use client';

import { Button, Typography, Divider } from 'antd';
import Image from 'next/image';
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
      <div className={styles.background}></div>
      <div className={styles.formSection}>
        <div className={styles.verificationForm}>
          <Text>Verify your email</Text>
          <Title level={2} style={{ marginTop: 8, marginBottom: 24 }}>
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
        </div>
      </div>
    </div>
  );
} 
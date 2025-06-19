'use client';

import { Typography, Button } from 'antd';
import styles from '../../signupProcess.module.css';

const { Title, Text } = Typography;

interface WaitingStepProps {
  onNext: () => void;
}

export default function WaitingStep({ onNext }: WaitingStepProps) {
  return (
    <div className={styles.formSection}>
      <Title level={2} className={styles.formTitle}>
        Thank You!
      </Title>
      
      <Text>
        We have received your submission. It usually takes 1-3 business days to verify your information.
      </Text>
      
      <Text style={{ display: 'block', marginTop: '24px' }}>
        Looking forward to having you join our Mentor community!
      </Text>

      {/* This button is for demo purposes - in production it would be triggered by admin verification */}
      <Button 
        type="primary" 
        size="large" 
        onClick={onNext}
        className={styles.submitButton}
      >
        Continue to Profile Setup
      </Button>
    </div>
  );
} 
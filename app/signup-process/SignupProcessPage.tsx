'use client';

import { useState } from 'react';
import { Layout, Steps } from 'antd';
import Navbar from '@/components/Navbar';
import VerificationForm from './components/forms/VerificationForm';
import WaitingStep from './components/forms/WaitingStep';
import ProfileForm from './components/forms/ProfileForm';
import styles from './signupProcess.module.css';

const { Content } = Layout;

const steps = [
  {
    title: 'Submit your information',
    description: 'Your information will only be used for MentorUp internal verification',
  },
  {
    title: 'Wait for verification',
    description: 'MentorUp verify information that you filled in, which usually takes 1-3 business days',
  },
  {
    title: 'Build your profile',
    description: 'Welcome to MentorUp community!',
  },
];

export default function SignupProcessPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    jobTitle: '',
    yearsOfExperience: '',
    linkedinProfile: '',
    introduction: '',
    skills: [],
    degree: '',
  });

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleFormDataChange = (newData: Partial<typeof formData>) => {
    setFormData({ ...formData, ...newData });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <VerificationForm 
            formData={formData} 
            onFormChange={handleFormDataChange}
            onNext={() => setCurrentStep(1)}
          />
        );
      case 1:
        return <WaitingStep onNext={() => setCurrentStep(2)} />;
      case 2:
        return (
          <ProfileForm 
            formData={formData}
            onFormChange={handleFormDataChange}
            onSubmit={() => console.log('Profile submitted:', formData)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Navbar />
      <Content className={styles.content}>
        <div className={styles.background}></div>
        <div className={styles.container}>
          <div className={styles.stepsSection}>
            <Steps
              direction="vertical"
              current={currentStep}
              items={steps}
              onChange={handleStepChange}
              className={styles.steps}
            />
          </div>
          <div className={styles.mainContent}>
            {renderStepContent()}
          </div>
        </div>
      </Content>
    </Layout>
  );
} 
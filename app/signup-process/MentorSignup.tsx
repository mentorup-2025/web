'use client';

import { useState } from 'react';
import { Steps, Button, Form, Input, InputNumber, Card } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';

const { Step } = Steps;

interface ServicePrices {
  consultation?: number;
  resume_review?: number;
  mock_interview?: number;
  career_guidance?: number;
}

export default function MentorSignup() {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const router = useRouter();

  const steps = [
    {
      title: 'Basic Info',
      content: (
        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[{ required: true, message: 'Please input your display name!' }]}
        >
          <Input placeholder="Enter your display name" />
        </Form.Item>
      ),
    },
    {
      title: 'Work Experience',
      content: (
        <>
          <Form.Item
            name="company"
            label="Company/School"
            rules={[{ required: true, message: 'Please input your company/school!' }]}
          >
            <Input placeholder="Enter your company or school name" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Your Title"
            rules={[{ required: true, message: 'Please input your title!' }]}
          >
            <Input placeholder="Enter your professional title" />
          </Form.Item>
          <Form.Item
            name="yearsOfExperience"
            label="Years of Professional Experience"
            rules={[{ required: true, message: 'Please select your years of experience!' }]}
          >
            <InputNumber
              min={1}
              max={20}
              placeholder="Select years of experience"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Services & Prices">
            <Form.Item
              name={['services', 'consultation']}
              label="Consultation"
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={0}
                placeholder="Price in USD"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name={['services', 'resume_review']}
              label="Resume Review"
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={0}
                placeholder="Price in USD"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name={['services', 'mock_interview']}
              label="Mock Interview"
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={0}
                placeholder="Price in USD"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name={['services', 'career_guidance']}
              label="Career Guidance"
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={0}
                placeholder="Price in USD"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Contact Info',
      content: (
        <>
          <Form.Item
            name="linkedin"
            label="LinkedIn Profile"
            rules={[
              { required: true, message: 'Please input your LinkedIn profile!' },
              { type: 'url', message: 'Please enter a valid URL!' }
            ]}
          >
            <Input placeholder="Enter your LinkedIn profile URL" />
          </Form.Item>
          <Form.Item
            name="wechat"
            label="WeChat ID"
            rules={[{ required: true, message: 'Please input your WeChat ID!' }]}
          >
            <Input placeholder="Enter your WeChat ID" />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Confirmation',
      content: (
        <div className={styles.confirmationContent}>
          <h2>Thank You & Welcome!</h2>
          <p>Thank you for submitting your information! Welcome to the MentorUp App.</p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => router.push('/search')}
          >
            Start Exploration
          </Button>
        </div>
      ),
    },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onFinish = (values: any) => {
    console.log('Form values:', values);
    next();
  };

  const handleStepClick = (step: number) => {
    // Allow going back to previous steps
    if (step < current) {
      setCurrent(step);
    }
    // For steps after current, only allow going to next step
    else if (step === current + 1) {
      setCurrent(step);
    }
  };

  return (
    <div className={styles.mentorSignup}>
      <Steps 
        current={current} 
        className={styles.steps}
        onChange={handleStepClick}
      >
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className={styles.stepsContent}>
        <div>
          {current === 0 && <h2>We would like to <span className={styles.blue}>learn more about you</span></h2>}
          {current === 1 && <h2>Tell us about <span className={styles.blue}>your work experience</span></h2>}
          {current === 2 && <h2>Join our <span className={styles.blue}>Mentor Community</span></h2>}
          {current === 3 && <h2><span className={styles.blue}>Thank You & Welcome!</span></h2>}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className={styles.form}
          >
            {steps[current].content}
            
            {current < steps.length - 1 && (
              <div className={styles.stepsAction}>
                {current > 0 && (
                  <Button style={{ margin: '0 8px' }} onClick={prev}>
                    Previous
                  </Button>
                )}
                <Button type="primary" onClick={next}>
                  Next
                </Button>
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
} 
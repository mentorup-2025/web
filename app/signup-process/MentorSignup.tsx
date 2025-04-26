'use client';

import { useState } from 'react';
import { Steps, Button, Form, Input, InputNumber, notification } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';

const { Step } = Steps;

interface MentorSignupProps {
  userId: string;
}

export default function MentorSignup({ userId }: MentorSignupProps) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});

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
            rules={[{ required: false }]}
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
              name="basePrice"
              label="Price for All Services"
              rules={[{ required: true, message: 'Please enter a base price!' }]}
            >
              <InputNumber
                min={0}
                placeholder="Price in USD"
                style={{ width: '100%' }}
                onChange={(value) => {
                  const services = [
                    { type: 'consultation', price: value },
                    { type: 'resume_review', price: value },
                    { type: 'mock_interview', price: value },
                    { type: 'career_guidance', price: value }
                  ];
                  form.setFieldsValue({ services });
                }}
              />
            </Form.Item>
            <div className={styles.serviceTypes}>
              <p>This price will be applied to all services. As a mentor, you can control the session length.</p>
              <ul>
                <li>Consultation</li>
                <li>Resume Review</li>
                <li>Mock Interview</li>
                <li>Career Guidance</li>
              </ul>
            </div>
          </Form.Item>

          {/* Hidden input to hold services structure */}
          <Form.Item name="services" noStyle>
            <Input type="hidden" />
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
          <Form.Item
            name="introduction"
            label="Introduction"
            rules={[{ required: true, message: 'Please enter an introduction!' }]}
          >
            <Input.TextArea rows={4} placeholder="Write a short introduction about yourself" />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Confirmation',
      content: (
        <div className={styles.confirmationContent}>
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

  const next = async () => {
    try {
      const values = await form.validateFields();
      const updated = { ...formData, ...values };
      setFormData(updated);

      if (current === 2) {
        await onFinish(updated);
        setCurrent(current + 1);
      } else {
        setCurrent(current + 1);
        form.setFieldsValue(updated);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
    form.setFieldsValue(formData);
  };

  const onFinish = async (allValues: any) => {
    try {
      const mentorData = {
        displayName: allValues.displayName,
        company: allValues.company,
        title: allValues.title,
        yearsOfExperience: Number(allValues.yearsOfExperience),
        years_of_experience_recorded_date: new Date(),
        services: allValues.services,
        linkedin: allValues.linkedin,
        wechat: allValues.wechat,
        introduction: allValues.introduction
      };

      const response = await fetch(`/api/mentor/upsert/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentorData),
      });

      const data = await response.json();

      if (data.code === -1) {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to create mentor profile',
        });
        throw new Error(data.message);
      }

      notification.success({
        message: 'Success',
        description: 'Mentor profile created successfully!',
      });
    } catch (error) {
      console.error('Error creating mentor profile:', error);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < current) {
      setCurrent(step);
      form.setFieldsValue(formData);
    } else if (step === current + 1) {
      next();
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

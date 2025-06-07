'use client';

import { useState } from 'react';
import { Steps, Button, Form, Input, Select, Card, Tag, Space, notification } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';

const { Step } = Steps;
const { Option } = Select;

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Telecommunications',
  'Energy',
  'Transportation',
  'Real Estate',
  'Consulting',
  'Government',
  'Non-profit'
];

interface MenteeSignupProps {
  userId: string;
}

export default function MenteeSignu({ userId }: MenteeSignupProps) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  const steps = [
    {
      title: 'Current Stage',
      content: (
        <>
          <Form.Item
            name="displayName"
            label="How do you want us to call you?"
            rules={[{ required: true, message: 'Please input your display name!' }]}
          >
            <Input placeholder="Enter your display name" />
          </Form.Item>

          <Form.Item
            name="wechat"
            label="WeChat ID"
            rules={[{ required: false }]}
          >
            <Input placeholder="Enter your WeChat ID" />
          </Form.Item>

          <Form.Item
            name="linkedin"
            label="LinkedIn Profile"
            rules={[
              { required: false, type: 'url', message: 'Please enter a valid URL!' }
            ]}
          >
            <Input placeholder="Enter your LinkedIn profile URL" />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Career Goals',
      content: (
        <>
          <Form.Item
            name="targetRole"
            label="Choose your target job role"
            rules={[{ required: true, message: 'Please select your target role!' }]}
          >
            <Select placeholder="Select your target role">
              <Option value="software_engineer">Software Engineer</Option>
              <Option value="product_manager">Product Manager</Option>
              <Option value="data_scientist">Data Scientist</Option>
              <Option value="ux_designer">UX Designer</Option>
              <Option value="project_manager">Project Manager</Option>
              <Option value="business_analyst">Business Analyst</Option>
              <Option value="devops_engineer">DevOps Engineer</Option>
              <Option value="qa_engineer">QA Engineer</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="targetLevel"
            label="Choose your desired job level"
            rules={[{ required: true, message: 'Please select your target level!' }]}
          >
            <Select placeholder="Select your target level">
              <Option value="entry">Entry Level</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="senior">Senior</Option>
              <Option value="lead">Lead</Option>
              <Option value="manager">Manager</Option>
              <Option value="director">Director</Option>
              <Option value="executive">Executive</Option>
            </Select>
          </Form.Item>
        </>
      ),
    }, 
    {
      title: 'Industries',
      content: (
        <div className={styles.industriesSection}>
          <div className={styles.industryBubbles}>
            {industries.map(industry => (
              <Tag
                key={industry}
                className={`${styles.industryBubble} ${
                  selectedIndustries.includes(industry) ? styles.selected : ''
                }`}
                onClick={() => {
                  if (selectedIndustries.includes(industry)) {
                    setSelectedIndustries(prev => prev.filter(i => i !== industry));
                  } else {
                    setSelectedIndustries(prev => [...prev, industry]);
                  }
                }}
              >
                {industry}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Confirmation',
      content: (
        <div className={styles.confirmationContent}>
          <p>Thanks for submitting your info!</p>
          <p>Let's explore the mentor community now!</p>
          <p className={styles.smallText}>
            Please contact <a href="mailto:contactus@mentorup.info">contactus@mentorup.info</a> for any questions!
          </p>
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

      if (current === 2) { // When moving from Step 3 to Step 4
        await onFinish(updated);
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
      // Update user profile with displayName, WeChat, LinkedIn, and industries
      const userUpdateData = {
        userId,
        username: allValues.displayName,
        wechat: allValues.wechat,
        linkedin: allValues.linkedin,
        industries: selectedIndustries
      };

      const userUpdateResponse = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userUpdateData),
      });

      const userUpdateResult = await userUpdateResponse.json();

      if (userUpdateResult.code === -1) {
        notification.error({
          message: 'Error',
          description: userUpdateResult.message || 'Failed to update user profile',
        });
        throw new Error(userUpdateResult.message);
      }

      notification.success({
        message: 'Success',
        description: 'Profile updated successfully!',
      });

      setCurrent(current + 1);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < current) {
      setCurrent(step);
    } else if (step === current + 1) {
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
          {current === 0 && <h2>Tell us what is your <span className={styles.blue}>Current Stage</span></h2>}
          {current === 1 && <h2>Tell us about <span className={styles.blue}>Your Goal</span></h2>}
          {current === 2 && <h2>Share your <span className={styles.blue}>Interested Industries</span></h2>}
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
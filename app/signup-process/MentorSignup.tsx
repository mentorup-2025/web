'use client';

import { useState, useEffect } from 'react';
import { Select, Steps, Button, Form, Input, InputNumber, Checkbox, Typography, notification, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';

const { Step } = Steps;
const { Text } = Typography;

interface MentorSignupProps {
  userId: string;
}

export default function MentorSignup({ userId }: MentorSignupProps) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});

  // compute suggestion based on years of experience
  const [suggestion, setSuggestion] = useState<string>('');
  useEffect(() => {
    const exp = form.getFieldValue('yearsOfExperience') || formData.yearsOfExperience || 0;
    let range = '';
    if (exp <= 2) range = '$35-50';
    else if (exp <= 5) range = '$50-85';
    else if (exp <= 10) range = '$85-100';
    else range = '$100-150';
    setSuggestion(range);
  }, [formData.yearsOfExperience, form.getFieldValue('yearsOfExperience')]);

  const serviceOptions = [
    'Free coffee chat (15 mins)',
    'Mock Interview',
    'Resume Review',
    'Behavioral Question Coaching',
    'Job Search Guidance',
    'General Career Advice',
    'Salary Negotiation',
    'Promotion Strategy',
    'My Company / Role Deep Dive',
    'Grad School Application Advice',
  ];

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Consulting',
    'Marketing',
    'Retail',
    'Manufacturing',
    'Government',
    'Non-Profit',
  ];

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const steps = [
    {
      title: 'Current Status',
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
            name="currentStatus"
            label="Which of the following best describes your current role?"
            rules={[{ required: true, message: 'Please select your current status!' }]}
          >
            <Select placeholder="Select your current role">
            <Select.Option value="student">Student</Select.Option>
            <Select.Option value="new_graduate">New Graduate</Select.Option>
            <Select.Option value="entry">Entry Level</Select.Option>
            <Select.Option value="intermediate">Intermediate</Select.Option>
            <Select.Option value="senior">Senior</Select.Option>
            <Select.Option value="manager">Manager</Select.Option>
            <Select.Option value="director">Director</Select.Option>
            <Select.Option value="executive">Executive</Select.Option>
            <Select.Option value="startup_founder">Startup Founder</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="wechat"
            label="WeChat ID"
            rules={[{ required: true, message: 'Please input your WeChat ID!' }]}
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

          <Form.Item
            name="introduction"
            label="Please introduce yourself to your future mentees."
            rules={[{ required: false, message: 'Please enter an introduction!' }]}
          >
            <Input.TextArea rows={4} placeholder="Share your experience and why you want to be a mentor." />
          </Form.Item>

          
        </>
      ),
    },
    {
      title: 'Work Experience',
      content: (
        <>
          <Form.Item
            name="company"
            label="Where do you work now?"
            rules={[{ required: false }]}
          >
            <Input placeholder="Enter your company or school name" />
          </Form.Item>
          <Form.Item
            name="title"
            label="What's your current job title?"
            rules={[{ required: true, message: 'Please input your title!' }]}
          >
            <Input placeholder="Enter your professional title" />
          </Form.Item>
          <Form.Item
            name="yearsOfExperience"
            label="How many years of professional experience do you have?"
            rules={[{ required: true, message: 'Please select your years of experience!' }]}
          >
            <Select placeholder="Select years of experience">
              {Array.from({ length: 20 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'year' : 'years'}
                </Select.Option>
              ))}
              <Select.Option value={20}>20+ years</Select.Option>
            </Select>
          </Form.Item>

          {/* Hidden input to hold services structure */}
          <Form.Item name="services" noStyle>
            <Input type="hidden" />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Service and Pricing',
      content: (
        <>
          <Form.Item
            name="basePrice"
            label="How much would you like to get paid per hour?"
            rules={[{ required: true, message: 'Please enter a base price!' }]}
          >
            <InputNumber
              min={0}
              placeholder="Price in USD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* suggestion text */}
          {suggestion && (
            <Text type="secondary">
              Based on your experience, we suggest you start with {suggestion}/hour
            </Text>
          )}

          <Form.Item
            name="servicesList"
            label="Select the services you can provide"
            rules={[{ required: true, message: 'Please select at least one service!' }]}
          >
            <Checkbox.Group options={serviceOptions} />
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

      if (current === 3) {
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
      // construct services array from selected services and base price
      const services = (allValues.servicesList || []).map((type: string) => ({ type, price: allValues.basePrice }));

      const mentorData = {
        displayName: allValues.displayName,
        company: allValues.company,
        title: allValues.title,
        years_of_experience: Number(allValues.yearsOfExperience),
        years_of_experience_recorded_date: new Date(),
        services,
        linkedin: allValues.linkedin,
        wechat: allValues.wechat,
        introduction: allValues.introduction,
      };

      // First API call to create/update mentor profile
      const mentorResponse = await fetch(`/api/mentor/upsert/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentorData),
      });

      const mentorDataResult = await mentorResponse.json();

      if (mentorDataResult.code === -1) {
        notification.error({
          message: 'Error',
          description: mentorDataResult.message || 'Failed to create mentor profile',
        });
        throw new Error(mentorDataResult.message);
      }

      // Second API call to update user profile with LinkedIn and industries
      const userUpdateData = {
        userId,
        linkedin: allValues.linkedin,
        wechat: allValues.wechat,
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
          {current === 2 && <h2>Join our <span className={styles.blue}>hourly rate</span></h2>}
          {current === 3 && <h2>Join our <span className={styles.blue}>Mentor Community</span></h2>}
          {current === 4 && <h2><span className={styles.blue}>Thank You & Welcome!</span></h2>}
          
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

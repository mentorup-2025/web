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
  const [countdown, setCountdown] = useState(5);

  // Add auto redirect when reaching confirmation step
  useEffect(() => {
    if (current === 4) {
      const timer = setTimeout(() => {
        router.push(`/mentor-profile/${userId}#availability`);
      }, 5000);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [current, router, userId]);

  // Reset countdown when leaving confirmation step
  useEffect(() => {
    if (current !== 4) {
      setCountdown(5);
    }
  }, [current]);

  // compute suggestion based on current status
  const [suggestion, setSuggestion] = useState<string>('');
  useEffect(() => {
    const status = form.getFieldValue('currentStatus') || formData.currentStatus;
    let range = '';
    switch (status) {
      case 'student':
        range = '$20-60';
        break;
      case 'new_graduate':
        range = '$30-75';
        break;
      case 'entry':
        range = '$30-90';
        break;
      case 'intermediate':
        range = '$50-110';
        break;
      case 'senior':
        range = '$60-130';
        break;
      case 'manager':
        range = '$90-170';
        break;
      case 'director':
        range = '$120-220';
        break;
      case 'executive':
        range = '$180-300';
        break;
      case 'startup_founder':
        range = '$250-300';
        break;
      default:
        range = '';
    }
    setSuggestion(range);
  }, [formData.currentStatus, form.getFieldValue('currentStatus')]);

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
            rules={[
              { required: true, message: 'Please input your WeChat ID!' },
              { 
                pattern: /^[a-zA-Z0-9_-]{6,20}$/,
                message: 'WeChat ID must be 6-20 characters long and can only contain letters, numbers, underscores, and hyphens'
              }
            ]}
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
            rules={[{ required: true, message: 'Please select your title!' }]}
          >
            <Select
              showSearch
              placeholder="Select your professional title, type to search"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                {
                  label: 'Software & IT',
                  options: [
                    { value: 'Software Engineer', label: 'Software Engineer' },
                    { value: 'Software Developer', label: 'Software Developer' },
                    { value: 'Data Analyst', label: 'Data Analyst' },
                    { value: 'Data Scientist', label: 'Data Scientist' },
                    { value: 'Business Analyst', label: 'Business Analyst' },
                    { value: 'Systems Analyst', label: 'Systems Analyst' },
                    { value: 'Web Developer', label: 'Web Developer' },
                    { value: 'Full Stack Developer', label: 'Full Stack Developer' },
                    { value: 'Java Developer', label: 'Java Developer' },
                    { value: 'Python Developer', label: 'Python Developer' },
                    { value: 'DevOps Engineer', label: 'DevOps Engineer' },
                    { value: 'Cloud Engineer', label: 'Cloud Engineer' },
                    { value: 'Machine Learning Engineer', label: 'Machine Learning Engineer' },
                    { value: 'Network Engineer', label: 'Network Engineer' },
                    { value: 'Database Administrator', label: 'Database Administrator' },
                    { value: 'IT Project Manager', label: 'IT Project Manager' },
                    { value: 'Information Security Analyst', label: 'Information Security Analyst' },
                  ],
                },
                {
                  label: 'Engineering',
                  options: [
                    { value: 'Mechanical Engineer', label: 'Mechanical Engineer' },
                    { value: 'Electrical Engineer', label: 'Electrical Engineer' },
                    { value: 'Civil Engineer', label: 'Civil Engineer' },
                    { value: 'Manufacturing Engineer', label: 'Manufacturing Engineer' },
                    { value: 'Industrial Engineer', label: 'Industrial Engineer' },
                    { value: 'Quality Engineer', label: 'Quality Engineer' },
                  ],
                },
                {
                  label: 'Finance & Business',
                  options: [
                    { value: 'Financial Analyst', label: 'Financial Analyst' },
                    { value: 'Accountant', label: 'Accountant' },
                    { value: 'Auditor', label: 'Auditor' },
                    { value: 'Management Analyst', label: 'Management Analyst' },
                    { value: 'Market Research Analyst', label: 'Market Research Analyst' },
                    { value: 'Economist', label: 'Economist' },
                    { value: 'Operations Research Analyst', label: 'Operations Research Analyst' },
                  ],
                },
                {
                  label: 'Healthcare & Science',
                  options: [
                    { value: 'Medical Scientist', label: 'Medical Scientist' },
                    { value: 'Biochemist', label: 'Biochemist' },
                    { value: 'Research Associate', label: 'Research Associate' },
                    { value: 'Pharmacist', label: 'Pharmacist' },
                    { value: 'Physical Therapist', label: 'Physical Therapist' },
                  ],
                },
                {
                  label: 'Education',
                  options: [
                    { value: 'Postsecondary Teacher', label: 'Postsecondary Teacher' },
                    { value: 'Research Assistant', label: 'Research Assistant' },
                    { value: 'Instructional Coordinator', label: 'Instructional Coordinator' },
                  ],
                },
                {
                  label: 'Other Tech & Support Roles',
                  options: [
                    { value: 'UI/UX Designer', label: 'UI/UX Designer' },
                    { value: 'Product Manager', label: 'Product Manager' },
                    { value: 'QA Analyst', label: 'QA Analyst' },
                    { value: 'Technical Support Specialist', label: 'Technical Support Specialist' },
                    { value: 'ERP Consultant', label: 'ERP Consultant (e.g., SAP, Oracle)' },
                  ],
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="yearsOfExperience"
            label="How many years of professional experience do you have?"
            rules={[{ required: true, message: 'Please select your years of experience!' }]}
          >
            <Select placeholder="Select years of experience">
              <Select.Option value={1}>1 year</Select.Option>
              <Select.Option value={2}>2 years</Select.Option>
              <Select.Option value={3}>3 years</Select.Option>
              <Select.Option value={4}>4 years</Select.Option>
              <Select.Option value={5}>5 years</Select.Option>
              <Select.Option value={6}>6 years</Select.Option>
              <Select.Option value={7}>7 years</Select.Option>
              <Select.Option value={8}>8 years</Select.Option>
              <Select.Option value={9}>9 years</Select.Option>
              <Select.Option value={10}>10 years</Select.Option>
              <Select.Option value={11}>11 years</Select.Option>
              <Select.Option value={12}>12 years</Select.Option>
              <Select.Option value={13}>13 years</Select.Option>
              <Select.Option value={14}>14 years</Select.Option>
              <Select.Option value={15}>15 years</Select.Option>
              <Select.Option value={16}>16 years</Select.Option>
              <Select.Option value={17}>17 years</Select.Option>
              <Select.Option value={18}>18 years</Select.Option>
              <Select.Option value={19}>19 years</Select.Option>
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
            <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
              <Text style={{ color: '#1990ff', fontSize: '14px', fontWeight: 'normal' }}>
                Based on your experience, we suggest you start with {suggestion}/hour
              </Text>
            </div>
          )}

          <Form.Item
            name="servicesList"
            label="Select the services you can provide"
            rules={[{ required: true, message: 'Please select at least one service!' }]}
          >
            <Checkbox.Group 
              options={serviceOptions} 
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            />
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
          <p>This page will automatically redirect to your profile in {countdown} seconds. If not, please click the button below to go to the main page.</p>
          <Button 
            type="default" 
            size="large"
            onClick={() => router.push('/mentor-list')}
            style={{ marginRight: '16px' }}
          >
            Start Exploration
          </Button>
          {/* todo: make mentor-profile availability tab open by url */}
          <Button 
            type="primary" 
            size="large"
            onClick={() => router.push(`/mentor-profile/${userId}`)}
          >
            Setup your availability
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
        company: allValues.company,
        title: allValues.title,
        years_of_experience: Number(allValues.yearsOfExperience),
        years_of_experience_recorded_date: new Date(),
        services,
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
        username: allValues.displayName,
        linkedin: allValues.linkedin ?? '',
        wechat: allValues.wechat ?? '',
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
        className={`stepsClassName ${styles.steps}`}
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
          {current === 4 && <h2>Welcome to the <span className={styles.blue}>MentorUp Community! </span>We're excited to have you here.</h2>}
          
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

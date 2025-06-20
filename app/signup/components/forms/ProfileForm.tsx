'use client';

import { Form, Input, InputNumber, Select, Button, Typography } from 'antd';
import styles from '../../signupProcess.module.css';

const { Title } = Typography;

const AVAILABLE_SKILLS = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'System Design',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'Career Guidance',
  'Resume Review',
  'Interview Preparation',
];

const DEGREES = [
  'Bachelor\'s',
  'Master\'s',
  'Ph.D.',
  'Other',
];

interface ProfileFormProps {
  formData: any;
  onFormChange: (data: any) => void;
  onSubmit: () => void;
}

export default function ProfileForm({ formData, onFormChange, onSubmit }: ProfileFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onFormChange(values);
    onSubmit();
  };

  return (
    <div className={styles.formSection}>
      <Title level={2} className={styles.formTitle}>
        Build up your profile
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Profile Name"
          name="name"
          rules={[{ required: true, message: 'Please input your profile name!' }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="Current Company"
          name="company"
          rules={[{ required: true, message: 'Please input your company!' }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="Job Title"
          name="jobTitle"
          rules={[{ required: true, message: 'Please input your job title!' }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="Years of Experience"
          name="yearsOfExperience"
          rules={[{ required: true, message: 'Please input your years of experience!' }]}
        >
          <InputNumber size="large" min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Your Introduction"
          name="introduction"
          rules={[{ required: true, message: 'Please input your introduction!' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Skills and Services"
          name="skills"
          rules={[{ required: true, message: 'Please select at least one skill!' }]}
        >
          <Select
            mode="multiple"
            size="large"
            placeholder="Select your skills and services"
            options={AVAILABLE_SKILLS.map(skill => ({ label: skill, value: skill }))}
          />
        </Form.Item>

        <Form.Item
          label="Highest Degree"
          name="degree"
          rules={[{ required: true, message: 'Please select your highest degree!' }]}
        >
          <Select
            size="large"
            options={DEGREES.map(degree => ({ label: degree, value: degree }))}
          />
        </Form.Item>

        <Form.Item
          label="LinkedIn Profile Link"
          name="linkedinProfile"
          rules={[
            { required: true, message: 'Please input your LinkedIn profile link!' },
            { type: 'url', message: 'Please enter a valid URL!' }
          ]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block className={styles.submitButton}>
            Complete Profile
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 
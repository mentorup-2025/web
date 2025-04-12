'use client';

import { Form, Input, InputNumber, Button, Typography } from 'antd';
import styles from '../../signupProcess.module.css';

const { Title, Text } = Typography;

interface VerificationFormProps {
  formData: any;
  onFormChange: (data: any) => void;
  onNext: () => void;
}

export default function VerificationForm({ formData, onFormChange, onNext }: VerificationFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onFormChange(values);
    onNext();
  };

  return (
    <div className={styles.formSection}>
      <Title level={2} className={styles.formTitle}>
        Mentor Verification
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input your name!' }]}
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
            Submit for Verification
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 
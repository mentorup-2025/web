'use client';

import { useState, useEffect } from 'react';
import {
    Select,
    Steps,
    Button,
    Form,
    Input,
    InputNumber,
    Checkbox,
    Typography,
    notification,
    Tag,
    Modal,
    Upload,
    Avatar
} from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { SERVICE_OPTIONS as serviceOptions } from '../services/constants';
import { isFreeCoffeeChat } from '../services/constants';
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

    // ---------- Avatar states ----------
    const [uploadImageVisible, setUploadImageVisible] = useState(false);
    const [avatarUploaded, setAvatarUploaded] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

    // Add auto redirect when reaching confirmation step
    useEffect(() => {
        if (current === 4) {
            const timer = setTimeout(() => {
                router.push(`/mentor-profile/${userId}#availability`);
            }, 5000);

            const countdownInterval = setInterval(() => {
                setCountdown((prev) => {
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

    const industries = [
        'Technology', 'Consulting', 'Education',
        'Healthcare', 'Biotech', 'Manufacturing',
        'Finance', 'Energy', 'Startups',
        'Retail', 'Government', 'Engineering',
        'Automotive', 'Logistics',
        'Telecommunications', 'Construction'
    ];

    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

    // ---------- avatar upload handlers ----------
    const handleImageUpload = async (file: File) => {
        const formDataFD = new FormData();
        formDataFD.append('file', file);
        formDataFD.append('userId', userId);

        const res = await fetch('/api/profile_image/update', {
            method: 'POST',
            body: formDataFD,
        });

        const result = await res.json();

        if (result?.code === 0) {
            // 后端若返回新的头像 URL，优先用；否则用本地预览
            const url: string | undefined =
                result?.data?.profile_url || result?.profile_url || undefined;

            if (url) setAvatarPreview(url);
            else setAvatarPreview(URL.createObjectURL(file));

            setAvatarUploaded(true);
            form.setFieldsValue({ avatar: 'uploaded' }); // Update form field to satisfy validation
            console.log('🔍 DEBUG: Upload success - avatarUploaded set to true, form field set to:', form.getFieldValue('avatar'));
            notification.success({ message: 'Profile image updated successfully' });
            setUploadImageVisible(false);
        } else {
            throw new Error(result?.message || 'Failed to update profile image');
        }
    };

    const uploadProps = {
        beforeUpload: (file: File) => {
            const isImage =
                file.type === 'image/jpeg' ||
                file.type === 'image/png' ||
                file.type === 'image/gif' ||
                file.type.startsWith('image/');

            if (!isImage) {
                notification.error({ message: 'You can only upload image files (JPG/PNG/GIF)!' });
                return Upload.LIST_IGNORE;
            }
            const isLt3M = file.size / 1024 / 1024 < 3;
            if (!isLt3M) {
                notification.error({ message: 'Image must be smaller than 3MB!' });
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async ({ file, onSuccess, onError }: any) => {
            try {
                await handleImageUpload(file as File);
                onSuccess?.({});
            } catch (e: any) {
                onError?.(e);
            }
        },
        showUploadList: false,
    };

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

                    {/* ---------- Avatar section (required) ---------- */}
                    <Form.Item
                        name="avatar"
                        label="Please upload your profile picture"
                        style={{ marginBottom: 8 }}
                    >
                        <Input type="hidden" />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '8px 0',
                            }}
                        >
                            <Avatar
                                size={72}
                                src={avatarPreview}
                                icon={<UserOutlined />}
                                style={{ flex: '0 0 auto' }}
                            />
                            <div style={{ lineHeight: 1.4, color: '#8c8c8c' }}>
                                <div>Recommended size: 240 × 240 px</div>
                                <div>JPG, PNG, GIF, Max size: 3MB</div>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <Button
                                    icon={<UploadOutlined />}
                                    onClick={() => setUploadImageVisible(true)}
                                >
                                    Upload
                                </Button>
                            </div>
                        </div>
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
                                message:
                                    'WeChat ID must be 6-20 characters long and can only contain letters, numbers, underscores, and hyphens',
                            },
                        ]}
                    >
                        <Input placeholder="Enter your WeChat ID" />
                    </Form.Item>

                    <Form.Item
                        name="linkedin"
                        label="LinkedIn Profile"
                        rules={[{ required: false, type: 'url', message: 'Please enter a valid URL!' }]}
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

                    {/* ---------- Avatar Upload Modal ---------- */}
                    <Modal
                        title="Edit Profile Avatar"
                        open={uploadImageVisible}
                        onCancel={() => setUploadImageVisible(false)}
                        footer={null}
                        width={560}
                    >
                        <div style={{ padding: '8px 0' }}>
                            <Upload.Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <UserOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag pictures to this area to upload</p>
                                <p className="ant-upload-hint">Support JPG, PNG, GIF. Max 3MB.</p>
                            </Upload.Dragger>
                        </div>
                    </Modal>
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
                        rules={[{ required: true, message: 'Please enter your company or school name!' }]}
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
                            {Array.from({ length: 19 }, (_, i) => (
                                <Select.Option key={i + 1} value={i + 1}>
                                    {i + 1} {i + 1 === 1 ? 'year' : 'years'}
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
                        <InputNumber min={0} placeholder="Price in USD" style={{ width: '100%' }} />
                    </Form.Item>

                    {suggestion && (
                        <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
                            <Text style={{ color: '#9254DE', fontSize: '14px', fontWeight: 'normal' }}>
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
                    <h3>Select Industries You Are Interested In</h3>
                    <p style={{ color: '#8c8c8c', marginBottom: '20px' }}>(Feel free to select multiple.)</p>

                    <div className={styles.industryBubbles}>
                        {industries.map((industry) => (
                            <Tag
                                key={industry}
                                className={`${styles.industryBubble} ${
                                    selectedIndustries.includes(industry) ? styles.selected : ''
                                }`}
                                onClick={() => {
                                    if (selectedIndustries.includes(industry)) {
                                        setSelectedIndustries((prev) => prev.filter((i) => i !== industry));
                                    } else {
                                        setSelectedIndustries((prev) => [...prev, industry]);
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
            title: 'Confirm',
            content: (
                <div className={styles.confirmationContent}>
                    <p>
                        This page will automatically redirect to your profile in {countdown} seconds. If not,
                        please click the button below to go to the main page.
                    </p>
                    <Button
                        type="default"
                        size="large"
                        onClick={() => router.push('/mentor-list')}
                        style={{ marginRight: '16px' }}
                    >
                        Start Exploration
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        className={styles.button}
                        onClick={() => router.push(`/mentor-profile/${userId}#availability`)}
                    >
                        Setup your availability
                    </Button>
                </div>
            ),
        },
    ];

    const next = async () => {
        try {
            // Check if user has uploaded OR already has a profile image
            if (current === 0) {
                console.log('🔍 DEBUG Next button clicked:');
                console.log('- avatarUploaded:', avatarUploaded);
                console.log('- avatarPreview:', avatarPreview);
                console.log('- form avatar value:', form.getFieldValue('avatar'));
                
                const hasValidAvatar = avatarUploaded || (avatarPreview && avatarPreview.startsWith('http'));
                console.log('- hasValidAvatar:', hasValidAvatar);
                
                if (!hasValidAvatar) {
                    console.log('🚫 DEBUG: Manual check failed');
                    notification.error({ 
                        message: 'Profile picture required!',
                        description: 'Please upload your profile picture to continue.'
                    });
                    return;
                }
                console.log('✅ DEBUG: Manual check passed');
            }

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
            // 校验失败
        }
    };

    const prev = () => {
        setCurrent(current - 1);
        form.setFieldsValue(formData);
    };

    const onFinish = async (allValues: any) => {
        try {
            // construct services array from selected services and base price
            const services = (allValues.servicesList || []).map((type: string) => ({
                type,
                price: isFreeCoffeeChat(type) ? 0 : allValues.basePrice || 0,
            }));

            const mentorData = {
                company: (allValues.company || '').trim(),
                title: (allValues.title || '').trim(),
                years_of_experience: Number(allValues.yearsOfExperience) || 0,
                years_of_experience_recorded_date: new Date(),
                services,
            };

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

            const userUpdateData = {
                userId,
                username: allValues.displayName || '',
                linkedin: allValues.linkedin || '',
                wechat: allValues.wechat || '',
                industries: selectedIndustries || [],
                introduction: allValues.introduction || '',
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
                size="small"
                direction="horizontal"
                responsive={false}
                items={steps.map(s => ({ title: s.title }))}
            />

            <div className={styles.stepsContent}>
                <div>
                    {current === 0 && (
                        <h2>
                            We would like to <span className={styles.blue}>learn more about you</span>
                        </h2>
                    )}
                    {current === 1 && (
                        <h2>
                            Tell us about <span className={styles.blue}>your work experience</span>
                        </h2>
                    )}
                    {current === 2 && (
                        <h2>
                            Join our <span className={styles.blue}>hourly rate</span>
                        </h2>
                    )}
                    {current === 3 && (
                        <h2>
                            Join our <span className={styles.blue}>Mentor Community</span>
                        </h2>
                    )}
                    {current === 4 && (
                        <h2>
                            Welcome to the <span className={styles.blue}>MentorUp Community! </span>We're excited to
                            have you here.
                        </h2>
                    )}

                    <Form form={form} layout="vertical" className={styles.form}>
                        {steps[current].content}

                        {current < steps.length - 1 && (
                            <div className={styles.stepsAction}>
                                {current > 0 && (
                                    <Button style={{ margin: '0 8px' }} onClick={prev}>
                                        Previous
                                    </Button>
                                )}
                                <Button type="primary" onClick={next} className={styles.button}>
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
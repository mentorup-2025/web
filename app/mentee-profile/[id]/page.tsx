'use client';

import {
  Layout,
  Tabs,
  Avatar,
  Typography,
  Space,
  Card,
  Alert,
  Modal,
  Input,
  Button,
  message,
  Upload,
  Select,
  Tag
} from 'antd';

import {
  EditOutlined,
  LinkedinFilled,
  GithubOutlined,
  InboxOutlined,
  LinkOutlined,
  FileOutlined, 
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../menteeProfile.module.css';
import { useUser } from '@clerk/nextjs';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState, useCallback } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

interface JobTarget {
  level: string;
  title: string;
}
function beautify(s?: string) {
  if (!s) return ''
  return s
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
}
export default function MenteeProfilePage() {
  const params = useParams();
  const menteeId = params?.id as string;
  const { user, isSignedIn } = useUser();
  const isOwnProfile = isSignedIn && user?.id === menteeId;
  
  // Debug logging for tests
  if (process.env.NODE_ENV === 'test') {
    console.log('[MenteeProfile DEBUG] menteeId:', menteeId);
    console.log('[MenteeProfile DEBUG] user?.id:', user?.id);
    console.log('[MenteeProfile DEBUG] isSignedIn:', isSignedIn);
    console.log('[MenteeProfile DEBUG] isOwnProfile:', isOwnProfile);
  }

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('about');

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftJobTarget, setDraftJobTarget] = useState<JobTarget>({ level: '', title: '' });
  const [draftLinkedin, setDraftLinkedin] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [draftIntro, setDraftIntro] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [uploadImageVisible, setUploadImageVisible] = useState(false);

  const [resumeKey, setResumeKey] = useState(0);
  const [draggerKey, setDraggerKey] = useState(0);

  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) setActiveTab(hash);
  }, []);

  const fetchUserData = useCallback(
      async (forceRefresh: boolean = false) => {
        console.log('[MenteeProfile] Fetching user data for:', menteeId);
        setLoading(true);
        try {
          const response = await fetch(`/api/user/${menteeId}`);
          const result = await response.json();

          if (result.code === 200) {
            setError(null);
            const data = result.data;
            setUserData(data);
            setDraftUsername(data.username || '');
            setDraftJobTarget({
              level: data.job_target?.level || '',
              title: data.job_target?.title || '',
            });
            setDraftLinkedin(data.linkedin || '');
            setIntroduction(data.introduction || '');
            console.log('[MenteeProfile] User data loaded:', data);
          } else {
            throw new Error(result.message || 'Failed to fetch user data');
          }
        } catch (err: any) {
          console.error('[MenteeProfile] Error fetching user data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      [menteeId]  // <- 依赖数组写在这里
  );
  useEffect(() => {
    fetchUserData();
  }, [menteeId]);

  // —————— Profile Image Upload ——————
  const handleImageUpload = async (file: File) => {
    console.log('[MenteeProfile] handleImageUpload called with file:', file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', menteeId);

      const response = await fetch('/api/profile_image/update', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('[MenteeProfile] Profile image upload response:', result);

      if (result.code === 0) {
        message.success('Profile image updated successfully');
        setUploadImageVisible(false);
        console.log('[MenteeProfile] Modal closed after successful upload');
        // Refresh the page data to show the new image
        await fetchUserData(true);
        // Force Clerk user to refresh
        if (user) {
          await user.reload();
        }
      } else {
        message.error(result.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('[MenteeProfile] Error uploading image:', error);
      message.error('Failed to upload image');
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      console.log('[MenteeProfile] beforeUpload called with file:', file);
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        console.log('[MenteeProfile] File rejected - not an image type:', file.type);
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE; // This prevents the file from being added to the list
      }
      const isLt4M = file.size / 1024 / 1024 < 4;
      if (!isLt4M) {
        console.log('[MenteeProfile] File rejected - too large:', file.size);
        message.error('Image must be smaller than 4MB!');
        return Upload.LIST_IGNORE; // This prevents the file from being added to the list
      }
      console.log('[MenteeProfile] File accepted, proceeding with upload');
      return true; // Allow the upload to proceed
    },
    onChange: (info: any) => {
      console.log('[MenteeProfile] onChange triggered with info:', info);
      if (info.file.status === 'removed') {
        console.log('[MenteeProfile] File removed');
        return;
      }
      if (info.file.status === 'done') {
        console.log('[MenteeProfile] File upload completed, calling handleImageUpload');
        handleImageUpload(info.file.originFileObj);
      } else if (info.file.status === 'uploading') {
        console.log('[MenteeProfile] File is uploading...');
      } else if (info.file.status === 'error') {
        console.log('[MenteeProfile] File upload error:', info.file.error);
      }
    },
    customRequest: ({ file, onSuccess, onError }: any) => {
      console.log('[MenteeProfile] customRequest called with file:', file);
      handleImageUpload(file)
        .then(() => {
          console.log('[MenteeProfile] Upload successful, calling onSuccess');
          onSuccess();
        })
        .catch((error) => {
          console.log('[MenteeProfile] Upload failed, calling onError:', error);
          onError(error);
        });
    },
  };

  const openEditProfileModal = () => {
    if (!userData) return;
    setDraftUsername(userData.username || '');
    setDraftJobTarget({
      level: userData.job_target?.level || '',
      title: userData.job_target?.title || '',
    });
    setDraftLinkedin(userData.linkedin || '');
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    console.log('[MenteeProfile] Saving profile:', {
      draftUsername,
      draftJobTarget,
      draftLinkedin
    });
    setUserData((prev: any) => ({
      ...prev,
      username: draftUsername,
      job_target: draftJobTarget,
      linkedin: draftLinkedin,
    }));
    setEditProfileVisible(false);

    try {
      const userUpdateResp = await fetch(`/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: menteeId,
          username: draftUsername,
          job_target: draftJobTarget,
          linkedin: draftLinkedin,
        }),
      });

      if (userUpdateResp.ok) {
        message.success('Profile updated successfully');
        fetchUserData(true);
      } else {
        message.error('Failed to update profile');
      }
    } catch (error) {
      console.error('[MenteeProfile] Error updating user profile:', error);
      message.error('Unexpected error while updating profile');
    }
  };

  const openIntroModal = () => {
    setDraftIntro(introduction);
    setEditModalVisible(true);
  };

  const handleModalOk = async () => {
    console.log('[MenteeProfile] Saving introduction:', draftIntro);
    setEditModalVisible(false);
    try {
      const introResp = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: menteeId,
          introduction: draftIntro,
        }),
      });
      if (introResp.ok) {
        setIntroduction(draftIntro);
        message.success('Introduction updated successfully');
      } else {
        message.error('Failed to update introduction');
      }
    } catch (err) {
      console.error('[MenteeProfile] Error updating introduction:', err);
      message.error('Unexpected error while updating introduction');
    }
  };

  const customResumeUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!userData) return;

    console.log('[MenteeProfile] Uploading resume:', file);
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      const errorMsg = '只允许上传 PDF、DOC、DOCX';
      message.error(errorMsg);
      onError(new Error(errorMsg));
      return;
    }

    setUploadingResume(true);

    try {
      // Request signed URL
      const uploadInit = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user_id, fileName: file.name }),
      });

      if (!uploadInit.ok) {
        throw new Error(`Failed to get upload URL: HTTP ${uploadInit.status}`);
      }

      const { signedUrl, fileUrl } = await uploadInit.json();

      // Upload file to S3
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to S3 failed');
      }

      // Update user record with new resume URL
      const updateRes = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user_id, resume: fileUrl }),
      });

      if (!updateRes.ok) {
        throw new Error('Failed to update resume URL');
      }

      // Refetch user data to refresh UI
      setUserData((prev: any) => (prev ? { ...prev, resume: fileUrl } : prev));
      setResumeKey(prev => prev + 1);
      setDraggerKey(prev => prev + 1);

      console.log('[MenteeProfile] Resume uploaded successfully:', fileUrl);
      // 正确调用 onSuccess
      onSuccess({ status: 'done', name: file.name, url: fileUrl }, file);
      message.success('Resume uploaded successfully');
      await fetchUserData(true);
    } catch (err: any) {
      console.error('[MenteeProfile] Resume upload failed:', err);
      message.error(err.message || 'Upload error');
      // 正确调用 onError
      onError(err);
    } finally {
      setUploadingResume(false);
    }
  };
  const handleDeleteResume = async () => {
    setDeletingResume(true);
    console.log('[MenteeProfile] Deleting resume for user:', userData?.user_id);
    try {
      const resp = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user_id, resume: null }),
      });

      if (!resp.ok) {
        throw new Error('Failed to delete resume');
      }

      setUserData((prev: any) => (prev ? { ...prev, resume: null } : prev));
      setResumeKey(prev => prev + 1);
      setDraggerKey(prev => prev + 1);

      console.log('[MenteeProfile] Resume deleted');
      message.success('Resume deleted successfully');
      await fetchUserData(true);
    } catch (err: any) {
      console.error('[MenteeProfile] Error deleting resume:', err);
      message.error(err.message || 'Failed to delete resume');
    } finally {
      setDeletingResume(false);
    }
  };
  if (loading) {
    console.log('[MenteeProfile] Loading...');
    return <div>Loading...</div>;
  }
  if (error) {
    console.error('[MenteeProfile] Error:', error);
    return <Alert message="Error" description={error} type="error" showIcon />;
  }
  if (!userData) {
    console.warn('[MenteeProfile] No user data found');
    return <Alert message="User not found" type="warning" showIcon />;
  }


  return (
      <Layout>
        <Navbar />
        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <div className={styles.avatarWrap}>
                  <Avatar
                      size={120}
                      src={userData.profile_url || '/placeholder-avatar.png'}
                      className={styles.avatar}
                      style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (isOwnProfile) setUploadImageVisible(true);
                      }}
                  />
                  {isOwnProfile && (
                      <button
                          type="button"
                          className={styles.avatarEditBtn}
                          aria-label="Edit profile photo"
                          onClick={() => setUploadImageVisible(true)}
                      >
                        <EditOutlined />
                      </button>
                  )}
                </div>
                <div className={styles.profileText}>
                  <Space align="center">
                      <Title level={2} style={{ margin: 0 }}>{userData.username}</Title>
                      {isOwnProfile && (
                          <EditOutlined style={{ cursor: 'pointer' }} onClick={openEditProfileModal} />
                      )}
                  </Space>
                  <Text className={styles.title} style={{ display: 'block', marginTop: 4 }}>
                    Target Job:&nbsp;
                    {(() => {
                      const rawTitle = userData.job_target?.title
                      const rawLevel = userData.job_target?.level

                      const title = beautify(rawTitle)
                      // 注意：Level 后面自带" Level"词尾
                      const level = rawLevel ? beautify(rawLevel) + ' Level' : ''

                      if (title && level) return `${title} (${level})`
                      if (title)         return title
                      if (level)         return level
                      return 'Not specified'
                    })()}
                  </Text>
                  <Space className={styles.socialLinks}>
                    {userData.linkedin && (
                        <a
                            href={
                              userData.linkedin.startsWith('http://') || userData.linkedin.startsWith('https://')
                                  ? userData.linkedin
                                  : `https://${userData.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                          <LinkedinFilled className={styles.socialIcon} />
                        </a>
                    )}
                    {userData.github && (
                        <a href={userData.github} target="_blank" rel="noopener noreferrer">
                          <GithubOutlined className={styles.socialIcon} />
                        </a>
                    )}
                  </Space>
                </div>
              </div>
            </div>

            {/* —— Profile Image Upload Modal —— */}
            <Modal
              title="Update Profile Image"
              open={uploadImageVisible}
              onCancel={() => {
                setUploadImageVisible(false);
                console.log('[MenteeProfile] Modal closed by user');
              }}
              footer={null}
              width={400}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Upload.Dragger {...uploadProps} showUploadList={false}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag image file to upload</p>
                  <p className="ant-upload-hint">
                    Support for JPG, PNG, GIF files. Max size: 25MB
                  </p>
                </Upload.Dragger>
              </div>
            </Modal>

            <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
              <TabPane tab="About Me" key="about">
                <Card
                    title="Introduction"
                    extra={<EditOutlined style={{ cursor: 'pointer' }} onClick={openIntroModal} />}
                >
                  <Paragraph>
                    {introduction && introduction.trim()
                        ? introduction
                        : "This mentee hasn't added a self introduction yet."}
                  </Paragraph>
                </Card>

                <Card key={resumeKey} title="Resume" style={{ marginTop: 24 }}>
                  {userData.resume ? (
                      <>
                        <div
                            style={{
                              padding: '0 24px',
                              marginTop: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: '1px solid #f0f0f0',
                              borderRadius: 4,
                              paddingLeft: 12,
                              paddingRight: 12,
                              height: 56,
                            }}
                        >
                          {/* 文件图标 + 文件名 */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FileOutlined style={{ fontSize: 20, marginRight: 8, color: '#1890ff' }} />
                            <a
                                href={userData.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1890ff', textDecoration: 'underline' }}
                            >
                              {userData.resume.split('/').pop()}
                            </a>
                          </div>

                          {/* 上传时间 + 删除按钮 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(Number(userData.resume.match(/\/(\d+)-/)?.[1])).format('MM/DD/YYYY')} Uploaded
                            </Text>

                            <DeleteOutlined
                                style={{ cursor: 'pointer', color: '#999' }}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Are you sure you want to delete your resume?',
                                    content: 'This action cannot be undone.',
                                    okText: 'Delete',
                                    okType: 'danger',
                                    cancelText: 'Cancel',
                                    onOk: handleDeleteResume,
                                  });
                                }}
                            />

                          </div>
                        </div>
                        <div style={{ padding: '12px 24px 0' }}>
                          <Text type="secondary">
                            Please delete the current resume before uploading a new one.
                          </Text>
                        </div>
                      </>
                  ) : (
                      <>
                        {/*<div style={{ padding: '0 24px 12px' }}>*/}
                        {/*  <Text type="secondary">请拖拽简历文件至下方区域（仅支持 PDF、Word）</Text>*/}
                        {/*</div>*/}
                        <Dragger
                            key={draggerKey}
                            name="file"
                            multiple={false}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx"
                            customRequest={customResumeUpload}
                            style={{ padding: '24px 0' }}
                        >
                          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                          <p className="ant-upload-text" style={{ marginTop: 16 }}>
                            Click or drag file to this area to upload
                          </p>
                          <p className="ant-upload-hint" style={{ marginTop: 8, color: '#888' }}>
                            Only PDF, DOC, and DOCX files are supported.
                          </p>
                        </Dragger>
                      </>
                  )}
                </Card>

                <Modal
                    title="Edit Profile"
                    open={editProfileVisible}
                    onCancel={() => setEditProfileVisible(false)}
                    footer={[
                      <Button key="cancel" onClick={() => setEditProfileVisible(false)}>Cancel</Button>,
                      <Button key="save" type="primary" onClick={handleSaveProfile}>Save</Button>,
                    ]}
                >
                  <Text strong>Username</Text>
                  <Input
                      value={draftUsername}
                      onChange={e => setDraftUsername(e.target.value)}
                      placeholder="Enter your username"
                      style={{ marginBottom: 12 }}
                  />

                  <Text strong>Job Target Level</Text>
                  <Select
                      value={draftJobTarget.level}
                      onChange={level => setDraftJobTarget(prev => ({ ...prev, level }))}
                      placeholder="Select your desired job level"
                      style={{ width: '100%', marginBottom: 12, marginTop: 4 }}
                  >
                    <Option value="entry">Entry Level</Option>
                    <Option value="intermediate">Intermediate</Option>
                    <Option value="senior">Senior</Option>
                    <Option value="lead">Lead</Option>
                    <Option value="manager">Manager</Option>
                    <Option value="director">Director</Option>
                    <Option value="executive">Executive</Option>
                  </Select>

                  <Text strong>Job Target Title</Text>
                  <Select
                      showSearch
                      value={draftJobTarget.title}
                      onChange={title => setDraftJobTarget(prev => ({ ...prev, title }))}
                      placeholder="Select your target job role"
                      optionFilterProp="children"
                      filterOption={(input, option) => {
                          if (!option || typeof option.label !== 'string') return false;
                          return option.label.toLowerCase().includes(input.toLowerCase());
                      }}
                      style={{ width: '100%', marginBottom: 12, marginTop: 4 }}
                  >
                    <Option value="ai_researcher" label="AI Researcher">AI Researcher</Option>
                    <Option value="backend_engineer" label="Backend Engineer">Backend Engineer</Option>
                    <Option value="blockchain_developer" label="Blockchain Developer">Blockchain Developer</Option>
                    <Option value="business_analyst" label="Business Analyst">Business Analyst</Option>
                    <Option value="business_intelligence" label="Business Intelligence">Business Intelligence</Option>
                    <Option value="cloud_architect" label="Cloud Architect">Cloud Architect</Option>
                    <Option value="data_analyst" label="Data Analyst">Data Analyst</Option>
                    <Option value="data_engineer" label="Data Engineer">Data Engineer</Option>
                    <Option value="data_scientist" label="Data Scientist">Data Scientist</Option>
                    <Option value="database_administrator" label="Database Administrator">Database Administrator</Option>
                    <Option value="devops_engineer" label="DevOps Engineer">DevOps Engineer</Option>
                    <Option value="engineering_manager" label="Engineering Manager">Engineering Manager</Option>
                    <Option value="frontend_engineer" label="Frontend Engineer">Frontend Engineer</Option>
                    <Option value="fullstack_engineer" label="Full Stack Engineer">Full Stack Engineer</Option>
                    <Option value="game_developer" label="Game Developer">Game Developer</Option>
                    <Option value="machine_learning_engineer" label="Machine Learning Engineer">Machine Learning Engineer</Option>
                    <Option value="mobile_developer" label="Mobile Developer">Mobile Developer</Option>
                    <Option value="network_engineer" label="Network Engineer">Network Engineer</Option>
                    <Option value="product_designer" label="Product Designer">Product Designer</Option>
                    <Option value="product_manager" label="Product Manager">Product Manager</Option>
                    <Option value="project_manager" label="Project Manager">Project Manager</Option>
                    <Option value="qa_engineer" label="QA Engineer">QA Engineer</Option>
                    <Option value="security_engineer" label="Security Engineer">Security Engineer</Option>
                    <Option value="software_engineer" label="Software Engineer">Software Engineer</Option>
                    <Option value="solution_architect" label="Solution Architect">Solution Architect</Option>
                    <Option value="system_administrator" label="System Administrator">System Administrator</Option>
                    <Option value="technical_lead" label="Technical Lead">Technical Lead</Option>
                    <Option value="technical_product_manager" label="Technical Product Manager">Technical Product Manager</Option>
                    <Option value="ui_designer" label="UI Designer">UI Designer</Option>
                    <Option value="ux_designer" label="UX Designer">UX Designer</Option>
                  </Select>

                  <Text strong>LinkedIn URL</Text>
                  <Input
                      value={draftLinkedin}
                      onChange={e => setDraftLinkedin(e.target.value)}
                      placeholder="https://www.linkedin.com/in/your-profile"
                  />
                </Modal>


                <Modal
                    title="Introduction"
                    open={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    footer={
                      <div style={{ marginTop: 24 }}>
                        <Space>
                          <Button key="cancel" onClick={() => setEditModalVisible(false)}>Cancel</Button>
                          <Button key="save" type="primary" onClick={handleModalOk}>Save</Button>
                        </Space>
                      </div>
                    }
                >
                  <TextArea
                      rows={4}
                      value={draftIntro}
                      onChange={e => setDraftIntro(e.target.value)}
                      maxLength={1500} // 限制输入最多 200 字
                      showCount // 显示字数计数器（可选）
                      placeholder="Edit your introduction"
                  />
                </Modal>
              </TabPane>

              <TabPane tab="My Sessions" key="sessions">
                <MySessionsTab />
              </TabPane>

              {/*<TabPane tab="Payment & Invoices" key="payments">*/}
              {/*  <PaymentTab />*/}
              {/*</TabPane>*/}
            </Tabs>
          </div>
        </Content>
      </Layout>
  );
}
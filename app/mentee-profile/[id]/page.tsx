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
  Tag
} from 'antd';
import {
  EditOutlined,
  LinkedinFilled,
  GithubOutlined,
  InboxOutlined,
  LinkOutlined,
  FileOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../menteeProfile.module.css';
import { useUser } from '@clerk/nextjs';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

interface JobTarget {
  level: string;
  title: string;
}

export default function MenteeProfilePage() {
  const params = useParams();
  const menteeId = params?.id as string;
  const { user, isSignedIn } = useUser();
  const isOwnProfile = isSignedIn && user?.id === menteeId;

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

  const [resumeKey, setResumeKey] = useState(0);
  const [draggerKey, setDraggerKey] = useState(0);

  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) setActiveTab(hash);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/${menteeId}`);
      const result = await response.json();

      if (result.code === 200) {
        const data = result.data;

        setUserData(data);
        setDraftUsername(result.data.username || '');
        setDraftJobTarget({
          level: data.job_target?.level || '',
          title: data.job_target?.title || '',
        });
        setDraftLinkedin(result.data.linkedin || '');
        setIntroduction(result.data.introduction || '');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch user data');
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUserData();
  }, [menteeId]);

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
      } else {
        message.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      message.error('Unexpected error while updating profile');
    }
  };

  const openIntroModal = () => {
    setDraftIntro(introduction);
    setEditModalVisible(true);
  };

  const handleModalOk = async () => {
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
      console.error('Error updating introduction:', err);
      message.error('Unexpected error while updating introduction');
    }
  };



  const customResumeUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!userData) return;

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
      await fetchUserData();
      setResumeKey(prev => prev + 1);
      setDraggerKey(prev => prev + 1);

      // 正确调用 onSuccess
      onSuccess({ status: 'done', name: file.name, url: fileUrl }, file);
      message.success('Resume uploaded successfully');
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      message.error(err.message || 'Upload error');
      // 正确调用 onError
      onError(err);
    } finally {
      setUploadingResume(false);
    }
  };
  const handleDeleteResume = async () => {
    setDeletingResume(true);

    try {
      const resp = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user_id, resume: null }),
      });

      if (!resp.ok) {
        throw new Error('Failed to delete resume');
      }

      await fetchUserData();
      setResumeKey(prev => prev + 1);
      setDraggerKey(prev => prev + 1);

      message.success('Resume deleted successfully');
    } catch (err: any) {
      console.error('Error deleting resume:', err);
      message.error(err.message || 'Failed to delete resume');
    } finally {
      setDeletingResume(false);
    }
  };
  if (loading) return <div>Loading...</div>;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;
  if (!userData) return <Alert message="User not found" type="warning" showIcon />;


  return (
      <Layout>
        <Navbar />
        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <Avatar
                    size={120}
                    src={isOwnProfile ? user?.imageUrl : (userData.avatar_url || '/placeholder-avatar.png')}
                    className={styles.avatar}
                />
                <div className={styles.profileText}>
                  <Space align="center">
                    <Title level={2} style={{ margin: 0 }}>{userData.username}</Title>
                    <EditOutlined style={{ cursor: 'pointer' }} onClick={openEditProfileModal} />
                  </Space>
                  <Text className={styles.title} style={{ display: 'block', marginTop: 4 }}>
                    Target Job:&nbsp;
                    {userData.job_target?.title}
                    {` (${userData.job_target?.level} level)`}
                  </Text>
                  <Space className={styles.socialLinks}>
                    {userData.linkedin && (
                        <a href={userData.linkedin} target="_blank" rel="noopener noreferrer">
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

            <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
              <TabPane tab="About Me" key="about">
                <Card
                    title="Introduction"
                    extra={<EditOutlined style={{ cursor: 'pointer' }} onClick={openIntroModal} />}
                >
                  <Paragraph>{introduction}</Paragraph>
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
                  <Input
                      value={draftJobTarget.level}                // MODIFIED: bind level
                      onChange={e => setDraftJobTarget(prev => ({ ...prev, level: e.target.value }))} // MODIFIED: update level
                  />
                  <Text strong>Job Target Title</Text>
                  <Input
                      value={draftJobTarget.title}                // MODIFIED: bind title
                      onChange={e => setDraftJobTarget(prev => ({ ...prev, title: e.target.value }))} // MODIFIED: update title
                  />
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
                    footer={[
                      <Button key="cancel" onClick={() => setEditModalVisible(false)}>Cancel</Button>,
                      <Button key="save" type="primary" onClick={handleModalOk}>Save</Button>,
                    ]}
                >
                  <TextArea
                      rows={4}
                      value={draftIntro}
                      onChange={e => setDraftIntro(e.target.value)}
                      placeholder="Edit your introduction"
                  />
                </Modal>
              </TabPane>

              <TabPane tab="My Sessions" key="sessions">
                <MySessionsTab />
              </TabPane>

              <TabPane tab="Payment & Invoices" key="payments">
                <PaymentTab />
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
  );
}
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
  Upload
} from 'antd';
import {
  EditOutlined,
  LinkedinFilled,
  GithubOutlined,
  InboxOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../menteeProfile.module.css';
import { useUser } from '@clerk/nextjs';


const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

interface UserData {
  user_id: string;
  username: string;
  email: string;
  created_at: string;
  github: string | null;
  linkedin: string | null;
  resume: string | null;  // 简历 URL
  industries: string[];
  wechat: string | null;
  status: string | null;
  job_target: string | null;
  mentee?: {
    interests?: string[];
    career_goals?: string;
    introduction?: string;
    education?: string;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  data: UserData;
}

export default function MenteeProfilePage() {
  const params = useParams();
  const menteeId = params?.id as string;

  const { user, isSignedIn } = useUser();
  const isOwnProfile = isSignedIn && user?.id === menteeId;


  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('about');

  /** ———— 编辑“简介” 相关状态 ———— **/
  const [introModalVisible, setIntroModalVisible] = useState(false);
  const [introDraft, setIntroDraft] = useState<string>('');
  const [introSaving, setIntroSaving] = useState(false);

  /** ———— 上传简历 相关状态 ———— **/
  const [uploadingResume, setUploadingResume] = useState(false);

  // 读取 URL hash 初始化标签页
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  // 拉取用户数据（包含 resume 字段）
  useEffect(() => {
    const fetchUserData = async () => {
      if (!menteeId) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/user/${menteeId}`);
        const result: ApiResponse = await response.json();
        if (result.code === 200) {
          setUserData(result.data);
        } else {
          setError(result.message || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [menteeId]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }
  if (!userData) {
    return (
        <Alert
            message="User not found"
            description="The requested user profile could not be found"
            type="warning"
            showIcon
        />
    );
  }

  /** 切换标签页时同步 URL hash **/
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `#${key}`);
  };

  /** 打开“编辑简介”模态框 **/
  const openIntroModal = () => {
    setIntroDraft(userData.mentee?.introduction || '');
    setIntroModalVisible(true);
  };

  /** 保存简介到后端 **/
  const handleIntroSave = async () => {
    if (!userData) return;
    setIntroSaving(true);
    try {
      const payload = {
        user_id: userData.user_id,
        introduction: introDraft.trim(),
      };
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.code === 200) {
        // 本地更新 state
        setUserData(prev =>
            prev
                ? {
                  ...prev,
                  mentee: {
                    ...prev.mentee,
                    introduction: introDraft.trim(),
                  },
                }
                : prev
        );
        message.success('Introduction updated successfully');
        setIntroModalVisible(false);
      } else {
        message.error(result.message || 'Failed to update introduction');
      }
    } catch (err) {
      console.error('Failed to update introduction:', err);
      message.error('Error while updating introduction');
    } finally {
      setIntroSaving(false);
    }
  };

  /** 自定义上传简历并更新用户 resume 字段 **/
  const customResumeUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!userData) return;

    // 仅接受 PDF / Word 文档
    const isValidType =
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!isValidType) {
      message.error('只允许上传 PDF、DOC、DOCX');
      onError(new Error('Invalid file type'));
      return;
    }

    // 1) 先向后端申请签名 URL
    setUploadingResume(true);
    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user_id,
          fileName: file.name,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const {
        signedUrl,
        fileUrl
      }: { signedUrl: string; fileUrl: string } = await response.json();

      // 2) 使用签名 URL 将二进制文件 PUT 到存储
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
      });
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('上传失败：', errorText);
        throw new Error('Upload to S3 failed');
      }

      // 3) PUT 成功后，再调用 /api/user/update，更新用户记录里的 resume 字段为 fileUrl
      const updatePayload = {
        user_id: userData.user_id,
        resume: fileUrl,
      };
      const updateRes = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (!updateRes.ok) throw new Error(`HTTP ${updateRes.status}`);
      const updateResult = await updateRes.json();
      if (updateResult.code !== 200) {
        throw new Error(updateResult.message || 'Failed to update resume URL');
      }

      // 4) 本地 state 更新，并通知 Upload 组件成功
      setUserData(prev =>
          prev
              ? {
                ...prev,
                resume: fileUrl,
              }
              : prev
      );
      message.success('Resume uploaded successfully');
      onSuccess(null, file);
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      message.error(err.message || 'Upload error');
      onError(err);
    } finally {
      setUploadingResume(false);
    }
  };

  return (
      <Layout>
        <Navbar />
        <Content className={styles.content}>
          <div className={styles.container}>
            {/* ========== 个人信息头部 ========== */}
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <Avatar
                    size={120}
                    src={
                      isOwnProfile
                          ? user?.imageUrl || '/placeholder-avatar.png'
                          : userData.resume || '/placeholder-avatar.png'
                    }
                    className={styles.avatar}
                />

                <div className={styles.profileText}>
                  <Title level={2}>{userData.username}</Title>
                  <Text className={styles.title}>
                    {userData.job_target || 'No job target specified'}
                  </Text>
                  <Space className={styles.socialLinks}>
                    {userData.linkedin && (
                        <a
                            href={userData.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                          <LinkedinFilled className={styles.socialIcon} />
                        </a>
                    )}
                    {userData.github && (
                        <a
                            href={userData.github}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                          <GithubOutlined className={styles.socialIcon} />
                        </a>
                    )}
                  </Space>
                </div>
              </div>
            </div>

            {/* ========== Tabs 区域 ========== */}
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane tab="About Me" key="about">
                <div className={styles.tabContent} style={{ gap: '24px' }}>
                  {/* =============================
                   第一张卡片：Introduction
                   ============================= */}
                  <Card
                      bordered={false}
                      className={styles.userInfoCard}
                      title={
                        <div style={{ padding: '0 24px', fontWeight: 500 }}>
                          Introduction
                        </div>
                      }
                  >
                    <div style={{ width: '100%' }}>
                      <p style={{ margin: '8px 0' }}>
                        {userData.mentee?.introduction ? (
                            userData.mentee.introduction
                        ) : (
                            <Text type="secondary">No introduction yet.</Text>
                        )}
                        <EditOutlined
                            style={{
                              float: 'right',
                              cursor: 'pointer',
                              marginRight: '24px',
                            }}
                            onClick={openIntroModal}
                        />
                      </p>
                    </div>
                  </Card>

                  {/* =============================
                   第二张卡片：拖拽上传简历
                   ============================= */}
                  <Card
                      bordered={false}
                      className={styles.resumeCard}
                      title={
                        <div style={{ padding: '0 24px', fontWeight: 500 }}>
                          Upload your resume
                        </div>
                      }
                  >



                    {/* 24px 左右留白后放 Dragger */}
                    <div style={{ padding: '0 24px' }}>
                      <Dragger
                          name="file"
                          multiple={false}
                          showUploadList={false}
                          accept=".pdf,.doc,.docx"
                          customRequest={customResumeUpload}
                          disabled={uploadingResume}
                          style={{ padding: '24px 0' }}
                      >
                        <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                        <p className="ant-upload-text" style={{ marginTop: 16 }}>
                          Click or drag file to this area to upload
                        </p>
                        <p
                            className="ant-upload-hint"
                            style={{ marginTop: 8, color: '#888' }}
                        >
                          Support for a single or bulk upload.
                          <br />
                          Strictly prohibit from uploading company data or other band
                          files.
                        </p>
                      </Dragger>
                    </div>
                    {/* 如果已有 resume，就用 🔗 + 文件名 */}
                    {userData.resume && (
                        <div
                            style={{
                              padding: '0 24px',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                        >
                          {/** 提取文件名 **/}
                          {(() => {
                            try {
                              const parts = userData.resume.split('/');
                              const fileName = parts[parts.length - 1] || userData.resume;
                              return (
                                  <>
                                    <LinkOutlined
                                        style={{
                                          fontSize: 24,
                                          marginRight: 8,
                                          cursor: 'pointer',
                                          color: '#1890ff',
                                        }}
                                        onClick={() => {
                                          // 使用局部变量确保类型安全
                                          const resumeUrl = userData.resume;
                                          if (resumeUrl) {
                                            window.open(resumeUrl, '_blank');
                                          } else {
                                            message.warning('简历不可用');
                                          }
                                        }}
                                    />
                                    <Text strong>
                                      <a
                                          href={userData.resume}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#1890ff' }}
                                      >
                                        {fileName}
                                      </a>
                                    </Text>
                                  </>
                              );
                            } catch {
                              // 万一 URL 格式意外，则 fallback 显示整个 URL
                              return (
                                  <>
                                    <LinkOutlined
                                        style={{
                                          fontSize: 24,
                                          marginRight: 8,
                                          cursor: 'pointer',
                                          color: '#1890ff',
                                        }}
                                        onClick={() => {
                                          // 先判断 resume 不为 null 时才打开
                                          if (userData.resume) {
                                            window.open(userData.resume, '_blank');
                                          }
                                        }}
                                    />
                                    <Text strong>
                                      <a
                                          href={userData.resume}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#1890ff' }}
                                      >
                                        {userData.resume}
                                      </a>
                                    </Text>
                                  </>
                              );
                            }
                          })()}
                        </div>
                    )}

                  </Card>
                </div>
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

        {/* ========== 编辑“简介” 的模态框 ========== */}
        <Modal
            title="Edit Introduction"
            open={introModalVisible}
            onCancel={() => setIntroModalVisible(false)}
            footer={[
              <Button
                  key="cancel"
                  onClick={() => setIntroModalVisible(false)}
                  disabled={introSaving}
              >
                Cancel
              </Button>,
              <Button
                  key="save"
                  type="primary"
                  loading={introSaving}
                  onClick={handleIntroSave}
              >
                Save
              </Button>,
            ]}
        >
          <TextArea
              rows={4}
              value={introDraft}
              onChange={e => setIntroDraft(e.target.value)}
              placeholder="Enter your introduction"
          />
        </Modal>
      </Layout>
  );
}
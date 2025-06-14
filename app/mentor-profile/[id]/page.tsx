'use client';

import {
  Layout,
  Tabs,
  Avatar,
  Typography,
  Space,
  Card,
  Input,
  message,
  Modal,
  Button,
  Tag,
  Checkbox,
} from 'antd';
import { LinkedinFilled, GithubOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MySessionsTab from '../components/MySessionsTab';
import AvailabilityTab from '../components/AvailabilityTab';
import PaymentTab from '../components/PaymentTab';
import styles from '../mentorProfile.module.css';
import { useUser } from '@clerk/nextjs';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 前端展示时使用的所有服务类型：
// key 要和后端返回的 service.type 对应，label 是给用户看的文字
const allServiceTypes = [
  { key: 'consultation', label: 'Free Coffee Chat (15 mins)' },
  { key: 'mock_interview', label: 'Mock Interview' },
  { key: 'resume_review', label: 'Resume Review' },
  { key: 'behavioral_coaching', label: 'Behavioral Question Coaching' },
  { key: 'job_search', label: 'Job Search Guidance' },
  { key: 'career_guidance', label: 'General Career Advice' },
  { key: 'salary_negotiation', label: 'Salary Negotiation' },
  { key: 'promotion_strategy', label: 'Promotion Strategy' },
  { key: 'role_deep_dive', label: 'My Company / Role Deep Dive' },
  { key: 'grad_school', label: 'Grad School Application Advice' },
];

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params?.id as string;
  const [mentorData, setMentorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('about');

  // —— 新增：用于编辑用户名、头衔、公司 的草稿 state  ——
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCompany, setDraftCompany] = useState('');
  const [draftLinkedin, setDraftLinkedin] = useState('');

  // 原有 state（Introduction、Services 等）保持不变……
  const [introduction, setIntroduction] = useState('');
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [draftServices, setDraftServices] = useState<Record<string, boolean>>({});
  const [draftPrice, setDraftPrice] = useState<number>(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftIntro, setDraftIntro] = useState('');
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [userLinkedin, setUserLinkedin] = useState<string>('');

  const { user, isSignedIn } = useUser();
  const isOwnProfile = isSignedIn && user?.id === mentorId;

  // 用于处理 URL hash 切换选项卡
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) setActiveTab(hash);
  }, []);

  // —— 1. 组件挂载／mentorId 变化时，从 /api/mentor/list 抓数据 ——
  useEffect(() => {
    const fetchMentorData = async () => {
      setLoading(true);
      if (!mentorId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/mentor/list`);
        const json = await res.json();

        if (res.ok && Array.isArray(json.data)) {
          const found = (json.data as any[]).find(item => item.user_id === mentorId);
          if (found) {
            setMentorData(found);

            // —— 初始化“编辑资料”的草稿  ——
            setDraftUsername(found.username || '');
            setDraftTitle(found.mentor?.title || '');
            setDraftCompany(found.mentor?.company || '');
            setDraftLinkedin(found.linkedin || '');

            // 1) 把 Introduction 存起来
            setIntroduction(found.mentor?.introduction || '');

            // 2) 处理 services（原有逻辑）……
            const rawServices = found.mentor?.services ?? {};
            const boolMap: Record<string, boolean> = {};
            const priceMap: Record<string, number> = {};

            if (Array.isArray(rawServices)) {
              rawServices.forEach((one: any) => {
                const k = one.type as string;
                const p = Number(one.price);
                boolMap[k] = true;
                priceMap[k] = isNaN(p) ? 0 : p;
              });
            } else {
              Object.entries(rawServices).forEach(([k, v]) => {
                boolMap[k] = true;
                priceMap[k] = Number(v);
              });
            }

            setServices(boolMap);
            setServicePrices(priceMap);
          } else {
            setMentorData(null);
          }
        } else {
          setMentorData(null);
        }
        // 2. 新增：从 /api/user/[id] 拉取 introduction
          const userRes = await fetch(`/api/user/${mentorId}`);
          if (userRes.ok) {
              const userJson = await userRes.json();
              setIntroduction(userJson.data.introduction || '');

          }

      } catch (err) {
        console.error(err);
        setMentorData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [mentorId]);

  useEffect(() => {
    console.log('🧠 Clerk user.id:', user?.id);
    console.log('📄 Page mentorId:', mentorId);
    console.log('🔍 isOwnProfile:', isOwnProfile);
    console.log('🖼️ Clerk user.imageUrl:', user?.imageUrl);
  }, [user, mentorId, isOwnProfile]);

  // —— “打开编辑资料 Modal” 时，用导师现有数据填充草稿：
  const openEditProfileModal = () => {
    if (!mentorData) return;
    setDraftUsername(mentorData.username || '');
    setDraftTitle(mentorData.mentor?.title || '');
    setDraftCompany(mentorData.mentor?.company || '');
    setDraftLinkedin(mentorData.linkedin || '');
    setEditProfileVisible(true);
  };

  // —— “保存资料” 按钮被点击 ——
  const handleSaveProfile = async () => {
    // 1. 本地先把 mentorData.username／mentor.title／mentor.company 更新
    setMentorData((prev: any) => ({
      ...prev,
      username: draftUsername,
      mentor: {
        ...prev.mentor,
        title: draftTitle,
        company: draftCompany,
        linkedin: draftLinkedin,
      },
    }));
    setEditProfileVisible(false);

    // 2. 调用 /api/user/update 更新 displayName
    try {
      const userUpdateResp = await fetch(`/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mentorId,               // 这里把 mentorId 当作 userId 传给后端
          username: draftUsername,     // 新的用户名
          linkedin: draftLinkedin,
        }),
      });

      if (userUpdateResp.ok) {
        message.success('Username updated successfully');
      } else {
        message.error('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      message.error('Unexpected error while updating username');
    }

    // 3. 调用 /api/mentor/upsert/${mentorId} 更新 title 和 company
    try {
      const mentorUpsertResp = await fetch(`/api/mentor/upsert/${mentorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTitle,
          company: draftCompany,
          // 如果后端 upsert 接口同时需要 introduction 或 services，可一并传：
          introduction,
          services: Object.entries(services)
              .filter(([key, checked]) => checked)
              .map(([key]) => ({ type: key, price: servicePrices[key] || 0 })),
        }),
      });

      if (mentorUpsertResp.ok) {
        message.success('Title & Company updated successfully');
      } else {
        message.error('Failed to update title/company');
      }
    } catch (error) {
      console.error('Error updating mentor data:', error);
      message.error('Unexpected error while updating title/company');
    }
  };
  // —— 2. 打开“编辑 Services”弹窗，把当前 state 复制到草稿里 ——
  const openServicesModal = () => {
    // 先把现有 services copy 到 draftServices
    setDraftServices({ ...services });

    // 如果已有服务被选，就把它们的价格之一作为 draftPrice 的初值
    const firstSelectedKey = Object.entries(services).find(([k, v]) => v)?.[0];
    setDraftPrice(firstSelectedKey ? servicePrices[firstSelectedKey] || 0 : 0);

    setServicesModalVisible(true);
  };

  // —— 3. “保存 Services” 按钮被点击 ——
  const handleServicesOk = async () => {
    // （1）把 draftServices 写回到正式 state
    setServices(draftServices);

    // （2）把所有被勾选的 key 都设置为 draftPrice，新 priceMap 只保留这些
    const newPriceMap: Record<string, number> = {};
    Object.entries(draftServices).forEach(([key, checked]) => {
      if (checked) {
        newPriceMap[key] = draftPrice;
      }
    });
    setServicePrices(newPriceMap);

    // （3）构造后端 upsert 所需的格式：{ services: [{ type, price }, … ] }
    const selectedArray = Object.entries(draftServices)
        .filter(([key, checked]) => checked)
        .map(([key]) => ({ type: key, price: draftPrice }));

    // （4）发请求到 `/api/mentor/upsert/${mentorId}`，同时把 introduction 一并带上
    try {
      const resp = await fetch(`/api/mentor/upsert/${mentorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introduction,           // “Introduction” 保持当前 state
          services: selectedArray // 新的“服务列表”
        }),
      });
      if (resp.ok) {
        message.success('Services updated successfully');
      } else {
        message.error('Failed to update services');
      }
    } catch (error) {
      console.error(error);
      message.error('Unexpected error while updating services');
    }

    setServicesModalVisible(false);
  };

  // —— 4. “保存 Introduction” 按钮被点击 ——
  const openEditModal = () => {
    setDraftIntro(introduction);
    setEditModalVisible(true);
  };
  const handleModalOk = async () => {
    // 先关闭 Modal
    setEditModalVisible(false);

    // 1. Update introduction via api/user/update
    try {
      const introResp = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mentorId,
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

    // 2. Prepare services payload
    const selectedArray = Object.entries(services)
        .filter(([key, checked]) => checked)
        .map(([key]) => ({ type: key, price: servicePrices[key] || 0 }));

    // 3. Update services via /api/mentor/upsert
    try {
      const svcResp = await fetch(`/api/mentor/upsert/${mentorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: selectedArray,
        }),
      });
      if (svcResp.ok) {
        message.success('Services updated successfully');
      } else {
        message.error('Failed to update services');
      }
    } catch (err) {
      console.error('Error updating services:', err);
      message.error('Unexpected error while updating services');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!mentorData) return <div>Mentor not found</div>;

  // 只把 services 里勾选为 true 的项拿出来，转成给 <Tag> 渲染的文字
  const selectedLabels = allServiceTypes
      .filter(s => services[s.key])
      .map(s => s.label);

  return (
      <Layout>
        <Navbar />
        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <Avatar
                    size={120}
                    src={
                      isOwnProfile
                          ? user?.imageUrl
                          : mentorData?.profile_url || '/placeholder-avatar.png'
                    }
                    className={styles.avatar}
                />
                <div className={styles.profileText}>
                  {/* —— 在这里展示 username、title、company，并加上编辑按钮 —— */}
                  <Space align="center">
                    <Title level={2} style={{ margin: 0 }}>
                      {mentorData.username}
                    </Title>
                    <EditOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={openEditProfileModal}
                    />
                  </Space>
                  <Text className={styles.title} style={{ display: 'block', marginTop: 4 }}>
                    {mentorData.mentor.title} @ {mentorData.mentor.company}
                  </Text>
                  <Space className={styles.socialLinks}>
                    {mentorData.linkedin && (
                        <a href={mentorData.linkedin} target="_blank" rel="noopener noreferrer">
                          <LinkedinFilled className={styles.socialIcon} />
                        </a>
                    )}
                    {mentorData.github && (
                        <a href={mentorData.github} target="_blank" rel="noopener noreferrer">
                          <GithubOutlined className={styles.socialIcon} />
                        </a>
                    )}
                  </Space>
                </div>
              </div>
            </div>

            {/* —— 编辑用户名/头衔/公司的 Modal —— */}
            <Modal
                title="Edit Profile"
                open={editProfileVisible}
                onCancel={() => setEditProfileVisible(false)}
                footer={[
                  <Button key="cancel" onClick={() => setEditProfileVisible(false)}>Cancel</Button>,
                  <Button key="save" type="primary" onClick={handleSaveProfile}>Save</Button>,
                ]}
            >
              {/* Username */}
              <div style={{ marginBottom: 12 }}>
                <Text strong>Username</Text>
                <Input
                    value={draftUsername}
                    onChange={e => setDraftUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{ marginTop: 4 }}
                />
              </div>

              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <Text strong>Title</Text>
                <Input
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="Enter your title"
                    style={{ marginTop: 4 }}
                />
              </div>

              {/* Company */}
              <div style={{ marginBottom: 12 }}>
                <Text strong>Company</Text>
                <Input
                    value={draftCompany}
                    onChange={e => setDraftCompany(e.target.value)}
                    placeholder="Enter your company"
                    style={{ marginTop: 4 }}
                />
              </div>

              {/* LinkedIn */}
              <div style={{ marginBottom: 12 }}>
                <Text strong>LinkedIn URL</Text>
                <Input
                    value={draftLinkedin}
                    onChange={e => setDraftLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    style={{ marginTop: 4 }}
                />
              </div>
            </Modal>

            <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)}>
              <TabPane tab="About Me" key="about">
                <div className={styles.tabContent}>
                  {/* —— Introduction 卡片 —— */}
                  <Card
                      title="Introduction"
                      extra={
                        <EditOutlined style={{ cursor: 'pointer' }} onClick={openEditModal} />
                      }
                      className={styles.infoCard}
                      style={{ borderRadius: '2px' }}
                  >
                    <Paragraph>{introduction}</Paragraph>
                  </Card>


                  {/* —— Services 卡片 —— */}
                  <Card
                      title="Services"
                      extra={<EditOutlined onClick={openServicesModal} />}
                      style={{ marginTop: 16, borderRadius: 4 }}
                  >
                    {selectedLabels.length > 0 ? (
                        selectedLabels.map(label => <Tag key={label}>{label}</Tag>)
                    ) : (
                        <Text type="secondary">No services selected</Text>
                    )}
                  </Card>

                  {/* —— 编辑 Introduction 的 Modal —— */}
                  <Modal
                      title="Introduction"
                      open={editModalVisible}
                      onCancel={() => setEditModalVisible(false)}
                      footer={
                        <div style={{ display: 'flex', width: '100%' }}>
                          <Button
                              key="cancel"
                              style={{ flex: 1, borderRadius: 2, marginRight: 8 }}
                              onClick={() => setEditModalVisible(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                              key="save"
                              type="primary"
                              style={{
                                flex: 1,
                                borderRadius: 2,
                                backgroundColor: '#1890ff',
                                borderColor: '#1890ff',
                              }}
                              onClick={handleModalOk}
                          >
                            Save
                          </Button>
                        </div>
                      }
                      style={{ borderRadius: 4 }}
                  >
                    <TextArea
                        rows={4}
                        value={draftIntro}
                        onChange={e => setDraftIntro(e.target.value)}
                        placeholder="Edit your introduction"
                        style={{ borderRadius: 2 }}
                    />
                  </Modal>

                  {/* —— 编辑 Services 的 Modal —— */}
                  <Modal
                      title="Edit Services"
                      open={servicesModalVisible}
                      onCancel={() => setServicesModalVisible(false)}
                      footer={[
                        <Button
                            key="cancel"
                            style={{ flex: 1, borderRadius: 2 }}
                            onClick={() => setServicesModalVisible(false)}
                        >
                          Cancel
                        </Button>,
                        <Button
                            key="save"
                            type="primary"
                            style={{
                              flex: 1,
                              borderRadius: 2,
                              backgroundColor: '#1890ff',
                              borderColor: '#1890ff',
                            }}
                            onClick={handleServicesOk}
                        >
                          Save
                        </Button>,
                      ]}
                      style={{ borderRadius: 4 }}
                  >
                    {/* —— 1. Price 输入区域 —— */}
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>Price</Text>
                      <Input
                          prefix="$"
                          suffix="/hour"
                          value={draftPrice}
                          onChange={e => {
                            const val = parseFloat(e.target.value.replace(/[^\d.]/g, ''));
                            setDraftPrice(isNaN(val) ? 0 : val);
                          }}
                          placeholder="Enter your hourly rate"
                          style={{ width: '100%', marginTop: 4 }}
                      />
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          We suggest you start with $20-40/hour.
                        </Text>
                      </div>
                    </div>

                    {/* —— 2. 所有服务复选框 —— */}
                    {allServiceTypes.map(svc => (
                        <div key={svc.key} style={{ marginBottom: 8 }}>
                          <Checkbox
                              checked={draftServices[svc.key] || false}
                              onChange={e =>
                                  setDraftServices(prev => ({
                                    ...prev,
                                    [svc.key]: e.target.checked,
                                  }))
                              }
                          >
                            {svc.label}
                          </Checkbox>
                        </div>
                    ))}
                  </Modal>
                </div>
              </TabPane>
              <TabPane tab="My Sessions" key="sessions">
                <MySessionsTab />
              </TabPane>
              <TabPane tab="Availability" key="availability">
                <AvailabilityTab userId={mentorId} />
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
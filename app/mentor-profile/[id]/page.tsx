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

  // "正式" 存放当前导师的 introduction
  const [introduction, setIntroduction] = useState('');
  // 用一个对象来标记：某个 key（如 "consultation"）是否被选中
  const [services, setServices] = useState<Record<string, boolean>>({});
  // 用一个对象来存放各个 service key 对应的价格，例如 { consultation: 123, mock_interview: 123, … }
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});

  // —— 编辑 Services 弹窗用到的草稿 state ——
  // draftServices 的 shape 和 services 一样，暂存用户在弹窗里勾选了哪些 checkbox
  const [draftServices, setDraftServices] = useState<Record<string, boolean>>({});
  // draftPrice 暂存弹窗里输入的那个数字（新版需求里统一所有被勾选服务的价格都用这一个值）
  const [draftPrice, setDraftPrice] = useState<number>(0);

  // “编辑 Introduction” 弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftIntro, setDraftIntro] = useState('');

  // “编辑 Services” 弹窗
  const [servicesModalVisible, setServicesModalVisible] = useState(false);

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
        // 注意：这里调用 /api/mentor/list，而不是 /api/user/…
        const res = await fetch(`/api/mentor/list`);
        const json = await res.json();
        console.log('【后端 /api/mentor/list 返回整体结果】：', json);

        if (res.ok && Array.isArray(json.data)) {
          // 找到 user_id === mentorId 的那条记录
          const found = (json.data as any[]).find(item => item.user_id === mentorId);
          console.log('【找到的当前导师数据】：', found);

          if (found) {
            setMentorData(found);

            // 1) 先把 Introduction 存起来
            setIntroduction(found.mentor?.introduction || '');

            // 2) 处理 services 字段——后端可能返回两种格式：
            //    A) 数组格式：services: [ { type: 'consultation', price: 123 }, … ]
            //    B) 对象格式：services: { consultation: 100, resume_review: 50, … }
            const rawServices = found.mentor?.services ?? {};
            const boolMap: Record<string, boolean> = {};
            const priceMap: Record<string, number> = {};

            if (Array.isArray(rawServices)) {
              // 情况 A：数组格式
              //    e.g. [ { type: 'consultation', price: 123 }, … ]
              rawServices.forEach((one: any) => {
                const k = one.type as string;
                const p = Number(one.price);
                boolMap[k] = true;
                priceMap[k] = isNaN(p) ? 0 : p;
              });
            } else {
              // 情况 B：对象格式
              //    e.g. { consultation: 100, resume_review: 50, … }
              Object.entries(rawServices).forEach(([k, v]) => {
                boolMap[k] = true;
                priceMap[k] = Number(v);
              });
            }

            console.log('【boolMap (服务勾选状态)】：', boolMap);
            console.log('【priceMap (服务对应价格)】：', priceMap);

            setServices(boolMap);
            setServicePrices(priceMap);
          } else {
            setMentorData(null);
            console.warn(`导师 ID=${mentorId} 未在 /api/mentor/list 返回的 data 里找到`);
          }
        } else {
          console.error('Failed to fetch mentor list or invalid format');
          setMentorData(null);
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
    setIntroduction(draftIntro);
    setEditModalVisible(false);

    // 重新把当前 services state 转成后端需要的数组格式
    const selectedArray = Object.entries(services)
        .filter(([key, checked]) => checked)
        .map(([key]) => ({ type: key, price: servicePrices[key] || 0 }));

    try {
      const resp = await fetch(`/api/mentor/upsert/${mentorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introduction: draftIntro,
          services: selectedArray,
        }),
      });
      if (resp.ok) {
        message.success('Introduction updated successfully');
      } else {
        message.error('Failed to update introduction');
      }
    } catch (error) {
      console.error(error);
      message.error('Unexpected error while updating introduction');
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
                <Avatar size={120} src="/placeholder-avatar.png" className={styles.avatar} />
                <div className={styles.profileText}>
                  <Title level={2}>{mentorData.username}</Title>
                  <Text className={styles.title}>
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

{/*<<<<<<< HEAD*/}
{/*                /!* Services Section *!/*/}
{/*                <div className={styles.servicesSection}>*/}
{/*                  <Title level={3}>Services</Title>*/}
{/*                  <div className={styles.serviceTags}>*/}
{/*                    {Array.isArray(mentorData.mentor.services) && mentorData.mentor.services.map(service => (*/}
{/*                      <Tag key={service.type} className={styles.serviceTag}>*/}
{/*                        {formatServiceType(service.type)} - ${service.price}*/}
{/*                      </Tag>*/}
{/*=======*/}
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
>>>>>>> db17096 (about me and availibility updated)
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
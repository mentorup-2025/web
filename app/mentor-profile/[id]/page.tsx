"use client";

import {
  Layout,
  Tabs,
  Avatar,
  Typography,
  Space,
  Card,
  Input,
  Select,
  message,
  Modal,
  Button,
  Tag,
  Checkbox,
  Popover,
  Upload,
} from "antd";
import {
  LinkedinFilled,
  GithubOutlined,
  EditOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MySessionsTab from "../components/MySessionsTab";
import AvailabilityTab from "../components/AvailabilityTab";
import PaymentTab from "../components/PaymentTab";
import styles from "../mentorProfile.module.css";
import { useUser } from "@clerk/nextjs";
import { allServiceTypes } from "../../services/constants";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;


const jobTitleOptions = [
  {
    label: "Software & IT",
    options: [
      { value: "Software Engineer", label: "Software Engineer" },
      { value: "Software Developer", label: "Software Developer" },
      { value: "Data Analyst", label: "Data Analyst" },
      { value: "Data Scientist", label: "Data Scientist" },
      { value: "Business Analyst", label: "Business Analyst" },
      { value: "Systems Analyst", label: "Systems Analyst" },
      { value: "Web Developer", label: "Web Developer" },
      { value: "Full Stack Developer", label: "Full Stack Developer" },
      { value: "Java Developer", label: "Java Developer" },
      { value: "Python Developer", label: "Python Developer" },
      { value: "DevOps Engineer", label: "DevOps Engineer" },
      { value: "Cloud Engineer", label: "Cloud Engineer" },
      {
        value: "Machine Learning Engineer",
        label: "Machine Learning Engineer",
      },
      { value: "Network Engineer", label: "Network Engineer" },
      { value: "Database Administrator", label: "Database Administrator" },
      { value: "IT Project Manager", label: "IT Project Manager" },
      {
        value: "Information Security Analyst",
        label: "Information Security Analyst",
      },
    ],
  },
  {
    label: "Engineering",
    options: [
      { value: "Mechanical Engineer", label: "Mechanical Engineer" },
      { value: "Electrical Engineer", label: "Electrical Engineer" },
      { value: "Civil Engineer", label: "Civil Engineer" },
      { value: "Manufacturing Engineer", label: "Manufacturing Engineer" },
      { value: "Industrial Engineer", label: "Industrial Engineer" },
      { value: "Quality Engineer", label: "Quality Engineer" },
    ],
  },
  {
    label: "Finance & Business",
    options: [
      { value: "Financial Analyst", label: "Financial Analyst" },
      { value: "Accountant", label: "Accountant" },
      { value: "Auditor", label: "Auditor" },
      { value: "Management Analyst", label: "Management Analyst" },
      { value: "Market Research Analyst", label: "Market Research Analyst" },
      { value: "Economist", label: "Economist" },
      {
        value: "Operations Research Analyst",
        label: "Operations Research Analyst",
      },
    ],
  },
  {
    label: "Healthcare & Science",
    options: [
      { value: "Medical Scientist", label: "Medical Scientist" },
      { value: "Biochemist", label: "Biochemist" },
      { value: "Research Associate", label: "Research Associate" },
      { value: "Pharmacist", label: "Pharmacist" },
      { value: "Physical Therapist", label: "Physical Therapist" },
    ],
  },
  {
    label: "Education",
    options: [
      { value: "Postsecondary Teacher", label: "Postsecondary Teacher" },
      { value: "Research Assistant", label: "Research Assistant" },
      {
        value: "Instructional Coordinator",
        label: "Instructional Coordinator",
      },
    ],
  },
  {
    label: "Other Tech & Support Roles",
    options: [
      { value: "UI/UX Designer", label: "UI/UX Designer" },
      { value: "Product Manager", label: "Product Manager" },
      { value: "QA Analyst", label: "QA Analyst" },
      {
        value: "Technical Support Specialist",
        label: "Technical Support Specialist",
      },
      { value: "ERP Consultant", label: "ERP Consultant (e.g., SAP, Oracle)" },
    ],
  },
];

const tabKeys = ["about", "sessions", "availability", "payments"] as const;
type TabKey = typeof tabKeys[number];

function labelToKey(label: string) {
  return allServiceTypes.find(s => s.label === label)?.key;
}

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params?.id as string;

  const { user, isSignedIn } = useUser();
  const isOwnProfile = isSignedIn && user?.id === mentorId;



  // Open Availability tab if URL contains 'availability' in query or hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const hash = window.location.hash;
      if (
        (search && search.toLowerCase().includes('availability')) ||
        (hash && hash.toLowerCase().includes('availability'))
      ) {
        setActiveTab('availability');
      }
    }
  }, []);

  const [mentorData, setMentorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // —————— 草稿 State ——————
  const [draftUsername, setDraftUsername] = useState("");
  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftIntro, setDraftIntro] = useState("");

  const [draftTitle, setDraftTitle] = useState("");
  const [draftCompany, setDraftCompany] = useState("");
  const [draftServices, setDraftServices] = useState<Record<string, boolean>>({});
  const [draftPrice, setDraftPrice] = useState(0);     // 毛利价，从后端来的原始 price
  const [netPrice, setNetPrice]       = useState(0);     // 用户在 UI 上输入的净价

  // —————— Modal 可见性 ——————
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editIntroVisible, setEditIntroVisible] = useState(false);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [uploadImageVisible, setUploadImageVisible] = useState(false);

  const initialHash = typeof window !== "undefined"
      ? (window.location.hash.slice(1) as TabKey)
      : null;
  const isValid = initialHash && tabKeys.includes(initialHash);
  const [activeTab, setActiveTab] = useState<TabKey>(
      isValid ? initialHash! : "about"
  );

  // 2️⃣ 切换 Tab 时更新 hash
  const onTabChange = (key: string) => {
    setActiveTab(key as TabKey);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${key}`);
    }
  };

  // 3️⃣ 监听地址栏手动改 hash
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.slice(1) as TabKey;
      if (tabKeys.includes(h)) {
        setActiveTab(h);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // —————— 1. GET /api/user/[id] 拉全量数据 ——————
  const fetchMentorData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/${mentorId}`);
      const { data } = await res.json();
      // user 侧字段
      setDraftUsername(data.username);
      setDraftLinkedin(data.linkedin);
      setDraftIntro(data.introduction ?? "")
      // mentor 侧字段
      const mentor = data.mentor || {};
      setDraftTitle(mentor.title || "");
      setDraftCompany(mentor.company || "");
      // services 从 data.mentor.services 数组里提取
      const boolMap: Record<string, boolean> = {};
      const priceMap: Record<string, number> = {};
      (data.mentor?.services || []).forEach((svc: any) => {
        const key = labelToKey(svc.type);
        if (key) {
          boolMap[key] = true;
          priceMap[key] = Number(svc.price);
        }
      });
      setDraftServices(boolMap);
      setDraftPrice(Object.values(priceMap)[0] || 0);
      const priceFromServer = Number(data.mentor?.services?.[0]?.price ?? 0);
      setDraftPrice(priceFromServer);

      // 2️⃣ 立刻根据你的公式算出 netPrice，并存进 state
      setNetPrice((priceFromServer - 5) / 1.45);
      setMentorData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentorData() }, [mentorId]);

  // —————— 2. “保存 Profile”（Username + LinkedIn + Title + Company + Services） ——————
  const handleSaveProfile = async () => {
    setEditProfileVisible(false);

    try {
      // 2.1 更新 用户表 (username, linkedin)
      const userRes = await fetch(`/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: mentorId,
          username: draftUsername,
          linkedin: draftLinkedin,
        }),
      });
      if (!userRes.ok) throw new Error("Failed to update user");

      // 2.2 更新 导师表 (title, company, services)
      const servicesPayload = Object.entries(draftServices)
          .filter(([_, checked]) => checked)
          .map(([key]) => {
            const label = allServiceTypes.find(s => s.key === key)!.label;
            return { type: label, price: draftPrice };
          });
      const mentorRes = await fetch(`/api/mentor/update/${mentorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          company: draftCompany,
          services: servicesPayload,
        }),
      });
      if (!mentorRes.ok) {
        const err = await mentorRes.json();
        throw new Error(err.error || "Failed to update mentor");
      }

      message.success("Profile updated");
      await fetchMentorData();
    } catch (err: any) {
      console.error(err);
      message.error(err.message);
    }
  };

  // —————— 3. “保存 Introduction” ——————
  const handleSaveIntro = async () => {
    setEditIntroVisible(false);
    try {
      const res = await fetch(`/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: mentorId,
          introduction: draftIntro,
        }),
      });
      if (!res.ok) throw new Error("Failed to update introduction");
      message.success("Introduction updated");
      await fetchMentorData();
    } catch (err: any) {
      console.error(err);
      message.error(err.message);
    }
  };

  // —————— 4. “保存 Services” ——————
  const handleSaveServices = async () => {
    setServicesModalVisible(false);
    try {
      const gross = netPrice * 1.45 + 5
      const servicesPayload = Object.entries(draftServices)
          .filter(([_, checked]) => checked)
          .map(([key]) => {
            // 先从 allServiceTypes 找到对应项，再取它的 label 作为真正的 type
            const label = allServiceTypes.find(s => s.key === key)?.label;
            return {
              type: label ?? key,      // 如果意外没找到，就暂时保底用 key
              price: Number(gross.toFixed(1))
            };
          });
      const res = await fetch(`/api/mentor/update/${mentorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesPayload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update services");
      }
      message.success("Services updated");
      await fetchMentorData();
    } catch (err: any) {
      console.error(err);
      message.error(err.message);
    }
  };

  // —— 在 UI 里，分别在针对 “Edit Profile” 按钮打开 `setEditProfileVisible(true)`，
  // “Edit Introduction” 按钮打开 `setEditIntroVisible(true)`，
  // “Edit Services” 按钮打开 `setServicesModalVisible(true)` 即可 ——

  // —————— Profile Image Upload ——————
  const handleImageUpload = async (file: File) => {
    console.log('[MentorProfile] handleImageUpload called with file:', file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', mentorId);

      console.log('[MentorProfile] Sending request to /api/profile_image/update with userId:', mentorId);
      const response = await fetch('/api/profile_image/update', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('[MentorProfile] API response:', result);

      if (result.code === 0) {
        message.success('Profile image updated successfully');
        setUploadImageVisible(false);
        console.log('[MentorProfile] Modal closed after successful upload');
        // Refresh the page data to show the new image
        await fetchMentorData();
        // Force Clerk user to refresh
        if (user) {
          await user.reload();
        }
      } else {
        message.error(result.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('[MentorProfile] Error uploading image:', error);
      message.error('Failed to upload image');
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      console.log('[MentorProfile] beforeUpload called with file:', file);
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        console.log('[MentorProfile] File rejected - not an image type:', file.type);
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE; // This prevents the file from being added to the list
      }
      const isLt4M = file.size / 1024 / 1024 < 4;
      if (!isLt4M) {
        console.log('[MentorProfile] File rejected - too large:', file.size);
        message.error('Image must be smaller than 4MB!');
        return Upload.LIST_IGNORE; // This prevents the file from being added to the list
      }
      console.log('[MentorProfile] File accepted, proceeding with upload');
      return true; // Allow the upload to proceed
    },
    onChange: (info: any) => {
      console.log('[MentorProfile] onChange triggered with info:', info);
      if (info.file.status === 'removed') {
        console.log('[MentorProfile] File removed');
        return;
      }
      if (info.file.status === 'done') {
        console.log('[MentorProfile] File upload completed, calling handleImageUpload');
        handleImageUpload(info.file.originFileObj);
      } else if (info.file.status === 'uploading') {
        console.log('[MentorProfile] File is uploading...');
      } else if (info.file.status === 'error') {
        console.log('[MentorProfile] File upload error:', info.file.error);
      }
    },
    customRequest: ({ file, onSuccess, onError }: any) => {
      console.log('[MentorProfile] customRequest called with file:', file);
      handleImageUpload(file)
        .then(() => {
          console.log('[MentorProfile] Upload successful, calling onSuccess');
          onSuccess();
        })
        .catch((error) => {
          console.log('[MentorProfile] Upload failed, calling onError:', error);
          onError(error);
        });
    },
  };

  if (loading) return <div>Loading…</div>;
  if (!mentorData) return <div>Not found</div>;

  // 只把 services 里勾选为 true 的项拿出来，转成给 <Tag> 渲染的文字
  const selectedLabels = allServiceTypes
      .filter((svc) => draftServices[svc.key])
      .map((svc) => svc.label);

  const priceSuggestionContent = (
      <div style={{ maxWidth: 240 }}>
        <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 12,
            }}
        >
          <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #f0f0f0', padding: 4 }}>Status</th>
            <th style={{ borderBottom: '1px solid #f0f0f0', padding: 4 }}>Suggested Price</th>
          </tr>
          </thead>
          <tbody>
          <tr><td style={{ padding: 4 }}>Student</td><td style={{ padding: 4 }}>$20–60</td></tr>
          <tr><td style={{ padding: 4 }}>New Graduate</td><td style={{ padding: 4 }}>$30–75</td></tr>
          <tr><td style={{ padding: 4 }}>Entry Level</td><td style={{ padding: 4 }}>$30–90</td></tr>
          <tr><td style={{ padding: 4 }}>Intermediate</td><td style={{ padding: 4 }}>$50–110</td></tr>
          <tr><td style={{ padding: 4 }}>Senior</td><td style={{ padding: 4 }}>$60–130</td></tr>
          <tr><td style={{ padding: 4 }}>Manager</td><td style={{ padding: 4 }}>$90–170</td></tr>
          <tr><td style={{ padding: 4 }}>Director</td><td style={{ padding: 4 }}>$120–220</td></tr>
          <tr><td style={{ padding: 4 }}>Executive</td><td style={{ padding: 4 }}>$180–300</td></tr>
          <tr><td style={{ padding: 4 }}>Startup Founder</td><td style={{ padding: 4 }}>$250–300</td></tr>
          </tbody>
        </table>
      </div>
  );

  // 放在组件最上面
  const formatUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };
// helper at top of your component file
  function formatTitleCompany(title?: string, company?: string) {
    const t = title?.trim();
    const c = company?.trim();

    if (t && c) {
      return `${t} @ ${c}`;
    }
    if (t) {
      return t;
    }
    if (c) {
      return c;
    }
    return "No title or company set";
  }

  return (
    <Layout>
      <Navbar />
      <Content className={styles.content}>
        <div className={styles.container}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={mentorData?.profile_url || "/placeholder-avatar.png"}
                  className={styles.avatar}
                  style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (isOwnProfile) {
                      setUploadImageVisible(true);
                    }
                  }}
                />
              </div>
              <div className={styles.profileText}>
                {/* —— 在这里展示 username、title、company，并加上编辑按钮 —— */}
                <Space align="center">
                  <Title level={2} style={{ margin: 0 }}>
                    {mentorData.username}
                  </Title>
                  <EditOutlined
                    style={{ cursor: "pointer" }}
                    onClick={() => setEditProfileVisible(true)}
                  />
                </Space>
                <Text
                    className={styles.title}
                    type={!mentorData.mentor.title && !mentorData.mentor.company ? "secondary" : undefined}
                    style={{ display: "block", marginTop: 4 }}
                >
                  {formatTitleCompany(
                      mentorData.mentor.title,
                      mentorData.mentor.company
                  )}
                </Text>
                <Space className={styles.socialLinks}>
                  {mentorData.linkedin && (
                      <a
                          href={formatUrl(mentorData.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                        <LinkedinFilled className={styles.socialIcon} />
                      </a>
                  )}
                  {mentorData.github && (
                    <a
                      href={mentorData.github}
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

          {/* —— Profile Image Upload Modal —— */}
          <Modal
            title="Update Profile Image"
            open={uploadImageVisible}
            onCancel={() => setUploadImageVisible(false)}
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

          {/* —— 编辑用户名/头衔/公司的 Modal —— */}
          <Modal
            title="Edit Profile"
            open={editProfileVisible}
            onCancel={() => setEditProfileVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setEditProfileVisible(false)}>
                Cancel
              </Button>,
              <Button key="save" type="primary" onClick={handleSaveProfile}>
                Save
              </Button>,
            ]}
          >
            {/* Username */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Username</Text>
              <Input
                value={draftUsername}
                onChange={(e) => setDraftUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ marginTop: 4 }}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Title</Text>
              <Select
                showSearch
                placeholder="Select your professional title, type to search"
                optionFilterProp="label"
                filterOption={(input, option) => {
                  if (!option || typeof option.label !== "string") return false;
                  return option.label
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }}
                value={draftTitle}
                onChange={(value) => setDraftTitle(value)}
                options={jobTitleOptions}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            {/* Company */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>Company</Text>
              <Input
                value={draftCompany}
                onChange={(e) => setDraftCompany(e.target.value)}
                placeholder="Enter your company"
                style={{ marginTop: 4 }}
              />
            </div>

            {/* LinkedIn */}
            <div style={{ marginBottom: 12 }}>
              <Text strong>LinkedIn URL</Text>
              <Input
                value={draftLinkedin}
                onChange={(e) => setDraftLinkedin(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-profile"
                style={{ marginTop: 4 }}
              />
            </div>
          </Modal>

          <Tabs activeKey={activeTab} onChange={onTabChange}>
            <TabPane tab="About Me" key="about">
              <div className={styles.tabContent}>
                {/* —— Introduction 卡片 —— */}
                <Card
                  title="Introduction"
                  extra={
                    <EditOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => setEditIntroVisible(true)}
                    />
                  }
                  className={styles.infoCard}
                  style={{ borderRadius: "2px" }}
                >
                  <Paragraph>
                    {draftIntro?.trim()
                        ? draftIntro
                        : "This mentor hasn't added a self introduction yet."}
                  </Paragraph>
                </Card>

                {/* —— Services 卡片 —— */}
                <Card
                  title="Services"
                  extra={<EditOutlined onClick={() => setServicesModalVisible(true)} />}
                  style={{ marginTop: 16, borderRadius: 4 }}
                >
                  {selectedLabels.length > 0 ? (
                    selectedLabels.map((label) => (
                      <Tag key={label}>{label}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">No services selected</Text>
                  )}
                </Card>

                {/* —— 编辑 Introduction 的 Modal —— */}
                <Modal
                  title="Introduction"
                  open={editIntroVisible}
                  onCancel={() => setEditIntroVisible(false)}
                  footer={
                    <div style={{ display: "flex", width: "100%" }}>
                      <Button
                        key="cancel"
                        style={{ flex: 1, borderRadius: 2, marginRight: 8 }}
                        onClick={() => setEditIntroVisible(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        key="save"
                        type="primary"
                        style={{
                          flex: 1,
                          borderRadius: 2,
                          backgroundColor: "#1890ff",
                          borderColor: "#1890ff",
                        }}
                        onClick={handleSaveIntro}
                      >
                        Save
                      </Button>
                    </div>
                  }
                  style={{ borderRadius: 4 }}
                >
                  <Text
                    style={{
                      display: "block",
                      marginBottom: 4,
                      textAlign: "right",
                      color: "#999",
                    }}
                  >
                    {(draftIntro?.length ?? 0)} / 1500
                  </Text>
                  <TextArea
                    rows={4}
                    value={draftIntro}
                    onChange={(e) => setDraftIntro(e.target.value)}
                    maxLength={1500}
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
                        backgroundColor: "#1890ff",
                        borderColor: "#1890ff",
                      }}
                      onClick={handleSaveServices}
                    >
                      Save
                    </Button>,
                  ]}
                  style={{ borderRadius: 4 }}
                >
                  {/* —— 1. Price 输入区域 —— */}
                  <div style={{ marginBottom: 12 }}>
                    {/* Label + Info icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Text strong>Price</Text>
                      <Popover
                          content={priceSuggestionContent}
                          title="Suggested Hourly Ranges"
                          trigger="hover"            // 鼠标移入显示，移出隐藏
                          // trigger="click"          // 如果你想点击才显示，改用这一行
                      >
                        <InfoCircleOutlined
                            style={{ color: '#1890FF', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                        />
                      </Popover>
                    </div>

                    <Input
                        prefix="$"
                        suffix="/hour"
                        value={netPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/[^\d.]/g, ''));
                          setNetPrice(isNaN(val) ? 0 : val);
                        }}
                        placeholder="Enter your hourly rate"
                        style={{ width: '100%', marginTop: 4 }}
                    />

                    {/* 可选：保留原先说明文字（不再显示表格）。 */}
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        We suggest you start within a range based on your current status. Hover the <InfoCircleOutlined style={{ color: '#1890FF' }} /> for details.
                      </Text>
                    </div>
                  </div>

                  {/* —— 2. 所有服务复选框 —— */}
                  {allServiceTypes.map((svc) => (
                    <div key={svc.key} style={{ marginBottom: 8 }}>
                      <Checkbox
                        checked={draftServices[svc.key] || false}
                        onChange={(e) =>
                          setDraftServices((prev) => ({
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
              <PaymentTab userId={mentorId} />
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
}

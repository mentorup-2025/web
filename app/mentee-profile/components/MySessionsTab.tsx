import { Typography } from 'antd';

const { Title } = Typography;

export default function MySessionsTab() {
  return (
    <div>
      <Title level={3}>My Sessions</Title>
      <p>Here you can view and manage all your mentee sessions.</p>
      <p>Coming soon: Session history, scheduling, and management features.</p>
    </div>
  );
} 
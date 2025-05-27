'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Tag, Space } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    FileOutlined,
    CalendarTwoTone,
    CloseCircleOutlined,
    FrownOutlined,
    BellOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Appointment {
    id: string;
    date: string;
    time: string;
    status: string;
    description: string;
    resume_url?: string;
    mentee: {
        name: string;
        avatar_url?: string;
    };
}

const mockAppointments: Appointment[] = [
    {
        id: '1',
        date: '06/01/2025',
        time: '06:00PM EST',
        status: 'Upcoming',
        description: 'dcdfhdkfhkjdhfkhjhfdkjhjdfhkhdkfhkdhfkhdkfjhkjhdxsdhckjsdhllldjlksjdlajlfkfhkjdhfkhjhfdkjhjdfhkhdkh',
        resume_url: 'https://example.com/xxx.png',
        mentee: {
            name: 'User Name Placeholder',
            avatar_url: '',
        },
    },
];

export default function MySessionsTab() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        setAppointments(mockAppointments);
    }, []);

    return (
        <div style={{ padding: '16px' }}>
            <Title level={3}>My Sessions</Title>

            {appointments.map((appt) => (
                <Card
                    key={appt.id}
                    style={{ marginBottom: 16 }}
                    title={
                        <Space>
                            <CalendarOutlined /> {appt.date}
                            <ClockCircleOutlined style={{ marginLeft: 16 }} /> {appt.time}
                            <Tag color="blue">{appt.status}</Tag>
                        </Space>
                    }
                    actions={[
                        <div key="reschedule">
                            <CalendarTwoTone style={{ fontSize: 18 }} />
                            <div>Reschedule</div>
                        </div>,
                        <div key="cancel">
                            <CloseCircleOutlined style={{ fontSize: 18 }} />
                            <div>Cancel</div>
                        </div>,
                        <div key="noshow">
                            <FrownOutlined style={{ fontSize: 18 }} />
                            <div>Report No Show</div>
                        </div>,
                        <div key="join">
                            <BellOutlined style={{ fontSize: 18 }} />
                            <div>Join the Meeting</div>
                        </div>,
                    ]}
                >
                    <Space>
                        <Avatar src={appt.mentee.avatar_url || undefined} />
                        <Text strong>{appt.mentee.name}</Text>
                    </Space>

                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Mentee Notes:</Text>
                        <p>{appt.description}</p>
                    </div>

                    {appt.resume_url && (
                        <div style={{ marginTop: 4 }}>
                            <FileOutlined />
                            <a href={appt.resume_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                                Resume
                            </a>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

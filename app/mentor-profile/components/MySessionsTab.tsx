'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Tag, Space, message, Spin, Empty } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    FileOutlined,
    CalendarTwoTone,
    CloseCircleOutlined,
    FrownOutlined,
    BellOutlined,
} from '@ant-design/icons';
import { useUser } from '@clerk/nextjs';

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

export default function MySessionsTab() {
    const { user } = useUser();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user?.id) return;

            try {
                const res = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id }),
                });

                const result = await res.json();

                if (!res.ok || result.code !== 0) {
                    throw new Error(result.msg || 'Failed to fetch appointments');
                }

                const transformed = result.data.appointments.map((appt: any) => {
                    const start = new Date(appt.time_slot?.lower);
                    const end = new Date(appt.time_slot?.upper);

                    const date = start.toLocaleDateString();
                    const time = `${start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })} - ${end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}`;

                    return {
                        id: appt.id,
                        date,
                        time,
                        status: appt.status,
                        description: appt.description,
                        resume_url: appt.resume_url,
                        mentee: {
                            name: appt.mentee?.username || 'Anonymous',
                            avatar_url: '', // 预留字段
                        },
                    };
                });

                setAppointments(transformed);
            } catch (error) {
                console.error('❌ Error fetching mentor appointments:', error);
                message.error('Failed to load appointments.');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user?.id]);

    return (
        <div style={{ padding: '16px' }}>
            <Title level={3}>My Sessions</Title>

            {loading ? (
                <Spin size="large" />
            ) : appointments.length === 0 ? (
                <Empty description="No sessions found." />
            ) : (
                appointments.map((appt) => (
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
                            <Avatar>{appt.mentee.name[0]}</Avatar>
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
                ))
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Typography, Space, message } from 'antd';
import { CheckCircleOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams?.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            console.log('✅ Payment successful for session:', sessionId);
            // You can verify the session here if needed
            setLoading(false);
        }
    }, [sessionId]);

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f5f5f5'
        }}>
            <Card style={{ 
                maxWidth: 500, 
                width: '100%', 
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <CheckCircleOutlined style={{ 
                        fontSize: '64px', 
                        color: '#52c41a' 
                    }} />
                    
                    <div>
                        <Title level={2} style={{ color: '#52c41a', marginBottom: '8px' }}>
                            Payment Successful!
                        </Title>
                        <Text type="secondary" style={{ fontSize: '16px' }}>
                            Your mentoring session has been confirmed and paid for.
                        </Text>
                    </div>

                    {sessionId && (
                        <div style={{ 
                            backgroundColor: '#f6ffed', 
                            padding: '12px', 
                            borderRadius: '6px',
                            border: '1px solid #b7eb8f'
                        }}>
                            <Text type="secondary">
                                Session ID: {sessionId}
                            </Text>
                        </div>
                    )}

                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Link href="/mentor-list" passHref>
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<HomeOutlined />}
                                style={{ width: '100%' }}
                            >
                                Browse More Mentors
                            </Button>
                        </Link>
                        
                        <Link href="/mentee-profile" passHref>
                            <Button 
                                size="large" 
                                icon={<UserOutlined />}
                                style={{ width: '100%' }}
                            >
                                View My Profile
                            </Button>
                        </Link>
                    </Space>

                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        You will receive a confirmation email shortly with session details.
                    </Text>
                </Space>
            </Card>
        </div>
    );
} 
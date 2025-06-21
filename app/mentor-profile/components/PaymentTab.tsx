'use client';

import { Typography, Card, Radio, Space, Button } from 'antd';
import { DollarOutlined, AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Paragraph } = Typography;

interface Appointment {
    price: number;
    mentor_id: string;
}

interface Props {
    userId: string;
}

export default function PaymentTab({ userId }: Props) {
    const [method, setMethod] = useState<'usd'|'alipay'|'wechat'>('alipay');
    const [earnings, setEarnings] = useState<number|null>(null);

    useEffect(() => {
        console.log('PaymentTab got userId:', userId);
        if (!userId) return;

        (async () => {
            try {
                const res = await fetch('/api/appointment/get', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId }),
                });
                if (!res.ok) throw new Error(`Fetch error: ${res.status}`);

                const payload = await res.json() as {
                    code: number;
                    message: string;
                    data: { appointments: Appointment[] };
                };

                // 只保留该 userId 作为 mentor 的记录
                const mentorAppts = payload.data.appointments.filter(
                    a => a.mentor_id === userId
                );

                // 求和
                const total = mentorAppts.reduce((sum, a) => sum + a.price, 0);
                setEarnings(total);
            } catch (err) {
                console.error(err);
                setEarnings(0);
            }
        })();
    }, [userId]);

    return (
        <div>
            <Card title="Earnings" style={{ marginBottom: 24 }}>
                <p>{earnings === null ? '-' : `$${earnings.toFixed(2)}`}</p>
                <p>Paid out: -</p>
            </Card>

            <Card title="Payout Methods">
                <Radio.Group
                    onChange={e => setMethod(e.target.value)}
                    value={method}
                    style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
                >
                    <Radio value="usd" style={{ width: 300 }}>
                        <Card size="small">
                            <Space>
                                <DollarOutlined style={{ fontSize: 20 }} />
                                <span>USD Payout</span>
                            </Space>
                            <Paragraph style={{ marginTop: 8, fontSize: 12 }}>
                                Get paid every 2 weeks — 1099 if you earn $600+
                            </Paragraph>
                        </Card>
                    </Radio>

                    <Radio value="alipay" style={{ width: 300 }}>
                        <Card size="small" bordered={method === 'alipay'}>
                            <Space>
                                <AlipayCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                                <span>AliPay</span>
                            </Space>
                            <Paragraph style={{ marginTop: 8, fontSize: 12 }}>
                                Paid monthly in CNY — 1st of each month
                            </Paragraph>
                            <Paragraph style={{ fontSize: 12 }}>Account: *********123</Paragraph>
                        </Card>
                    </Radio>

                    <Radio value="wechat" style={{ width: 300 }}>
                        <Card size="small">
                            <Space>
                                <WechatOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                                <span>WeChat</span>
                            </Space>
                            <Paragraph style={{ marginTop: 8, fontSize: 12 }}>
                                Paid monthly in CNY — 1st of each month
                            </Paragraph>
                        </Card>
                    </Radio>
                </Radio.Group>
            </Card>
        </div>
    );
}
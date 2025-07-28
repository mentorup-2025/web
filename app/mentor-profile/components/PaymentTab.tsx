'use client';

import { Typography, Card, Radio, Space, Button, Modal, Input, Checkbox } from 'antd';
import { DollarOutlined, AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Paragraph, Text } = Typography;

interface Appointment {
    price: number;
    mentor_id: string;
}

interface Props {
    userId: string;
}

interface PaymentMethod {
    value: 'usd'|'alipay'|'wechat';
    label: string;
    icon: React.ReactNode;
    description: string;
    accountInfo?: string;
    requiresModal: boolean;
    modalConfig: {
        title: string;
        confirmText: string;
        content: React.ReactNode;
    };
}

// Separate component for payment method card
const PaymentMethodCard = ({ 
    method, 
    isSelected, 
    onClick 
}: { 
    method: PaymentMethod; 
    isSelected: boolean; 
    onClick: () => void; 
}) => (
    <Radio value={method.value} style={{ width: 300 }} onClick={onClick}>
        <Card size="small" bordered={isSelected}>
            <Space>
                {method.icon}
                <span>{method.label}</span>
            </Space>
            <Paragraph style={{ marginTop: 8, fontSize: 12 }}>
                {method.description}
            </Paragraph>
            {method.accountInfo && (
                <Paragraph style={{ fontSize: 12 }}>{method.accountInfo}</Paragraph>
            )}
        </Card>
    </Radio>
);

// Separate component for payment method modal
const PaymentMethodModal = ({ 
    method, 
    visible, 
    onConfirm, 
    onCancel 
}: { 
    method: PaymentMethod; 
    visible: boolean; 
    onConfirm: () => void; 
    onCancel: () => void; 
}) => {
    if (!method.modalConfig) return null;

    // For WeChat and AliPay modals, we need to check form state
    const isWeChatModal = method.value === 'wechat';
    const isAliPayModal = method.value === 'alipay';
    const [wechatId, setWechatId] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [alipayName, setAlipayName] = useState('');
    const [alipayPhone, setAlipayPhone] = useState('');
    const [isAliPayConfirmed, setIsAliPayConfirmed] = useState(false);

    const isConnectDisabled = 
        (isWeChatModal && (!wechatId.trim() || !isConfirmed)) ||
        (isAliPayModal && (!alipayName.trim() || !alipayPhone.trim() || !isAliPayConfirmed));

    return (
        <Modal
            title={method.modalConfig.title}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button 
                    key="confirm" 
                    type="primary" 
                    style={{ 
                        backgroundColor: isConnectDisabled ? '#d9d9d9' : '#1890ff', 
                        borderColor: isConnectDisabled ? '#d9d9d9' : '#1890ff',
                        color: isConnectDisabled ? '#bfbfbf' : '#ffffff'
                    }}
                    onClick={onConfirm}
                    disabled={isConnectDisabled}
                >
                    {method.modalConfig.confirmText}
                </Button>
            ]}
            width={500}
        >
            {isWeChatModal ? (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, color: '#666666' }}>
                            We will pay you once a month in CNY on the first day of each month. You will be contacted on WeChat within 48 hours after submission. You can also reach out directly to us.{' '}
                            <Text strong style={{ color: '#1890ff' }}>(WeChatId: iampotato6)</Text>.
                        </Text>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            What is your WeChat ID?
                        </Text>
                        <Input
                            placeholder="Enter your WeChat ID"
                            value={wechatId}
                            onChange={(e) => setWechatId(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Checkbox
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                        >
                            <Text strong>I AM SURE THIS IS MY WECHAT ACCOUNT</Text>
                        </Checkbox>
                    </div>
                </>
            ) : isAliPayModal ? (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, color: '#666666' }}>
                            We will pay you once a month in CNY on the first day of each month. For any issues, please contact our WeChat Support.{' '}
                            <Text strong style={{ color: '#1890ff' }}>(WeChatID: iampotato6)</Text>.
                        </Text>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            What is your Alipay account name?
                        </Text>
                        <Input
                            placeholder="E.g. Xiao Wang"
                            value={alipayName}
                            onChange={(e) => setAlipayName(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            What is your Alipay phone number?
                        </Text>
                        <Input
                            placeholder="E.g. 188123123123"
                            value={alipayPhone}
                            onChange={(e) => setAlipayPhone(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Checkbox
                            checked={isAliPayConfirmed}
                            onChange={(e) => setIsAliPayConfirmed(e.target.checked)}
                        >
                            <Text strong>I AM SURE THIS IS MY ALIPAY INFORMATION</Text>
                        </Checkbox>
                    </div>
                </>
            ) : (
                method.modalConfig.content
            )}
        </Modal>
    );
};

// Separate hook for earnings data
const useEarnings = (userId: string) => {
    const [earnings, setEarnings] = useState<number|null>(null);

    useEffect(() => {
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

                const mentorAppts = payload.data.appointments.filter(
                    a => a.mentor_id === userId
                );

                const total = mentorAppts.reduce((sum, a) => sum + a.price, 0);
                setEarnings(total);
            } catch (err) {
                console.error(err);
                setEarnings(0);
            }
        })();
    }, [userId]);

    return earnings;
};

export default function PaymentTab({ userId }: Props) {
    const earnings = useEarnings(userId);
    const [method, setMethod] = useState<'usd'|'alipay'|'wechat'>('alipay');
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

    // Payment methods configuration
    const paymentMethods: PaymentMethod[] = [
        {
            value: 'usd',
            label: 'USD Payout',
            icon: <DollarOutlined style={{ fontSize: 20 }} />,
            description: 'Get paid every 2 weeks — 1099 if you earn $600+',
            requiresModal: true,
            modalConfig: {
                title: 'Contact Our Assistant',
                confirmText: 'I have Contacted Assistant',
                content: (
                    <>
                        <div style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, color: '#666666' }}>
                                We will pay you on the first date of each month in US dollars, and we will send you Form-1099 if your annual earning is &gt;= $600
                            </Text>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text>
                                For your information security, we will not store your bank account. Please contact our assistant to complete the order{' '}
                                <Text strong style={{ color: '#1890ff' }}>(WechatID: iampotato6)</Text>
                            </Text>
                        </div>
                    </>
                )
            }
        },
        {
            value: 'alipay',
            label: 'AliPay',
            icon: <AlipayCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />,
            description: 'Paid monthly in CNY — 1st of each month',
            accountInfo: 'Account: *********123',
            requiresModal: true,
            modalConfig: {
                title: 'Connect Your AliPay Account',
                confirmText: 'Connect',
                content: null // Content is handled directly in PaymentMethodModal
            }
        },
        {
            value: 'wechat',
            label: 'WeChat',
            icon: <WechatOutlined style={{ fontSize: 20, color: '#52c41a' }} />,
            description: 'Paid monthly in CNY — 1st of each month',
            requiresModal: true,
            modalConfig: {
                title: 'Connect Wechat Account',
                confirmText: 'Connect',
                content: null // Content is handled directly in PaymentMethodModal
            }
        }
    ];

    const handleMethodChange = (value: 'usd'|'alipay'|'wechat') => {
        const selectedMethod = paymentMethods.find(m => m.value === value);
        
        if (selectedMethod?.requiresModal) {
            setPendingMethod(selectedMethod);
            setModalVisible(true);
        } else {
            setMethod(value);
        }
    };

    const handleModalConfirm = () => {
        if (pendingMethod) {
            setMethod(pendingMethod.value);
        }
        setModalVisible(false);
        setPendingMethod(null);
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        setPendingMethod(null);
        // Reset to previous method if modal was cancelled
        setMethod('alipay');
    };

    return (
        <div>
            <Card title="Earnings" style={{ marginBottom: 24 }}>
                <p>{earnings === null ? '-' : `$${earnings.toFixed(2)}`}</p>
                <p>Paid out: -</p>
            </Card>

            <Card title="Payout Methods">
                <Radio.Group
                    onChange={e => handleMethodChange(e.target.value)}
                    value={method}
                    style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
                >
                    {paymentMethods.map((paymentMethod) => (
                        <PaymentMethodCard
                            key={paymentMethod.value}
                            method={paymentMethod}
                            isSelected={method === paymentMethod.value}
                            onClick={() => handleMethodChange(paymentMethod.value)}
                        />
                    ))}
                </Radio.Group>
            </Card>

            {/* Payment Method Modal */}
            {pendingMethod && (
                <PaymentMethodModal
                    method={pendingMethod}
                    visible={modalVisible}
                    onConfirm={handleModalConfirm}
                    onCancel={handleModalCancel}
                />
            )}
        </div>
    );
}
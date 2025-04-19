'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../../components/CheckoutForm'; // 改成实际路径
import { useState, useEffect } from 'react';
import { Button, Modal, message } from 'antd';  // 引入更多Ant Design组件

import { supabase } from '/Users/oscarzeng/Downloads/web/app/lib/supabaseClient'; // 根据路径调整

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LESSON_PRICE = 2000; // 20.00 USD

interface Order {
    id: string;
    amount: number;
    status: string;
    created: number;
    payment_intent: string;
}

export default function PaymentPage() {
    const [lessonCount, setLessonCount] = useState(1);
    const [totalAmount, setTotalAmount] = useState(LESSON_PRICE);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders') // 假设你在 Supabase 中有个叫 orders 的表
                .select('*')
                .eq('status', 'paid')
                .order('created', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
            } else {
                setOrders(data as Order[]);
            }
        };

        fetchOrders();
    }, []);

    const handleCountChange = (operation: 'increment' | 'decrement') => {
        let newCount = lessonCount;
        if (operation === 'increment') {
            newCount += 1;
        } else {
            newCount = Math.max(1, lessonCount - 1);
        }

        setLessonCount(newCount);
        setTotalAmount(newCount * LESSON_PRICE);
    };

    const handleRefundRequest = (orderId: string) => {
        setSelectedOrderId(orderId);
        setIsRefundModalVisible(true);
    };

    const handleConfirmRefund = async () => {
        if (!selectedOrderId) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'refund_pending' })
                .eq('id', selectedOrderId);

            if (error) {
                throw error;
            }

            message.success('Refund request submitted successfully!');

            setOrders(orders.map(order =>
                order.id === selectedOrderId ? { ...order, status: 'refund_pending' } : order
            ));

            setIsRefundModalVisible(false);
        } catch (error) {
            console.error('Refund failed:', error);
            message.error('Failed to process refund request');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                {/* 返回按钮 */}
                <button
                    onClick={() => window.history.back()}
                    className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
                >
                    <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Back to Previous
                </button>

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h1>

                {/* 显示可退款订单 */}
                {orders.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Your Recent Orders</h2>
                        <div className="space-y-3">
                            {orders.map(order => (
                                <div key={order.id} className="border rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">Order #{order.id.slice(-6)}</p>
                                        <p className="text-sm text-gray-600">
                                            ${(order.amount / 100).toFixed(2)} - {new Date(order.created).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => handleRefundRequest(order.id)}
                                        disabled={order.status !== 'paid'}
                                    >
                                        Request Refund
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 课程选择器 */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-700">Number of Lessons</span>
                        <div className="flex items-center">
                            <button
                                onClick={() => handleCountChange('decrement')}
                                disabled={lessonCount === 1}
                                className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${lessonCount === 1 ? 'bg-gray-200' : 'bg-blue-500 hover:bg-blue-600'} 
                  text-white transition-colors`}
                            >
                                -
                            </button>
                            <span className="mx-4 text-xl font-semibold">{lessonCount}</span>
                            <button
                                onClick={() => handleCountChange('increment')}
                                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* 价格显示 */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-semibold">${(LESSON_PRICE / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="text-xl font-bold text-blue-600">
              ${(totalAmount / 100).toFixed(2)}
            </span>
                    </div>
                </div>

                {/* Stripe支付表单 */}
                <Elements stripe={stripePromise}>
                    <CheckoutForm amount={totalAmount} />
                </Elements>
            </div>

            {/* 退款确认模态框 */}
            <Modal
                title="Confirm Refund"
                visible={isRefundModalVisible}
                onOk={handleConfirmRefund}
                onCancel={() => setIsRefundModalVisible(false)}
                confirmLoading={isLoading}
                okText="Confirm Refund"
                okButtonProps={{ danger: true }}
            >
                <p>Are you sure you want to request a refund for this order?</p>
                <p className="text-gray-600 mt-2">Refunds may take 5-10 business days to process.</p>
            </Modal>
        </div>
    );
}
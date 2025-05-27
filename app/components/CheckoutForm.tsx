'use client';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button, message } from 'antd';

export default function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        try {
            // ✅ 从 sessionStorage 获取 appointmentId
            const bookingDataRaw = sessionStorage.getItem('bookingDetails');
            if (!bookingDataRaw) {
                message.error('Missing booking data.');
                return;
            }

            const bookingData = JSON.parse(bookingDataRaw);
            const appointmentId = bookingData?.appointmentId;
            if (!appointmentId) {
                message.error('Missing appointment ID.');
                return;
            }

            // ✅ 创建 PaymentIntent
            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, appointmentId }), // 👈 必须传 appointmentId
            });

            const { clientSecret } = await res.json();

            // ✅ 付款确认
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                message.error(result.error.message || 'Payment failed');
            } else if (result.paymentIntent?.status === 'succeeded') {
                message.success('Payment successful!');

                // ✅ 通知主窗口
                if (window.opener) {
                    window.opener.postMessage({ type: 'paymentSuccess' }, '*');
                }

                sessionStorage.removeItem('bookingDetails'); // 清除数据

                // ✅ 自动关闭窗口
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        } catch (err) {
            console.error('Error during payment:', err);
            message.error('Unexpected error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <Button type="primary" htmlType="submit" loading={loading} className="mt-4">
                Pay ${(amount / 100).toFixed(2)}
            </Button>
        </form>
    );
}

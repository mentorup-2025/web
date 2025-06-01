'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button, message } from 'antd';

interface CheckoutFormProps {
    amount: number;
}

export default function CheckoutForm({ amount }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);

    const appointmentId = searchParams?.get('appointmentId');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        // ✅ 日志打印：确认传入的参数
        console.log('🧾 Final appointmentId sent to backend:', appointmentId);
        console.log('🧾 Final amount sent to backend:', amount);

        if (!appointmentId || !amount) {
            message.error('Missing appointment ID or amount.');
            return;
        }

        setLoading(true);

        try {
            // ✅ 创建 PaymentIntent
            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, appointmentId }),
            });

            const { clientSecret } = await res.json();

            // ✅ 确认付款
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                message.error(result.error.message || 'Payment failed');
            } else if (result.paymentIntent?.status === 'succeeded') {
                message.success('Payment successful!');

                // ✅ 通知原窗口成功
                if (window.opener) {
                    window.opener.postMessage({ type: 'paymentSuccess' }, '*');
                }

                // ✅ 自动关闭窗口
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        } catch (err) {
            console.error('Error during payment:', err);
            message.error('Unexpected error during payment.');
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

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button, message } from 'antd';
import { loadStripe } from '@stripe/stripe-js';

interface CheckoutFormProps {
    amount: number;
}

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutForm({ amount }: CheckoutFormProps) {
    const elements = useElements();
    const stripe = useStripe();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const appointmentId = searchParams?.get('appointmentId');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            console.error('❌ Stripe not initialized:', { stripe: !!stripe, elements: !!elements });
            message.error('Payment system is not ready. Please try again.');
            return;
        }

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

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const data = await res.json();
            console.log('📦 PaymentIntent response:', data);

            if (!data.clientSecret) {
                throw new Error('No client secret received');
            }

            // ✅ 确认付款
            console.log('🔑 Using client secret:', data.clientSecret);
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                    billing_details: {
                        // You can add billing details here if needed
                    },
                },
            });

            console.log('💳 Payment confirmation result:', result);

            if (result.error) {
                message.error(result.error.message || 'Payment failed');
                console.log('🔴 Payment failed:', result.error);
                // ✅ 通知主窗口失败
                if (window.opener) {
                    window.opener.postMessage({ type: 'paymentFailed' }, '*');
                }

                // ✅ 自动关闭 Stripe 支付页面
                setTimeout(() => {
                    window.close();
                }, 1000);
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
            console.error('❌ Error during payment:', err);
            message.error(err instanceof Error ? err.message : 'Unexpected error during payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement 
                options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                }}
            />
            <Button type="primary" htmlType="submit" loading={loading} className="mt-4">
                Pay ${(amount / 100).toFixed(2)}
            </Button>
        </form>
    );
}

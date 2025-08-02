'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button, message } from 'antd';
import { loadStripe } from '@stripe/stripe-js';

interface CheckoutFormProps {
    amount: number;
    appointmentId?: string;
}

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutForm({ amount, appointmentId }: CheckoutFormProps) {
    const elements = useElements();
    const stripe = useStripe();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const localAppointmentId = appointmentId ?? searchParams?.get('appointmentId');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ 日志打印：确认传入的参数
        console.log('🧾 Final appointmentId sent to backend:', appointmentId);
        console.log('🧾 Final amount sent to backend:', amount);

        if (!appointmentId || !amount) {
            message.error('Missing appointment ID or amount.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, appointmentId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const data = await res.json();
            console.log('📦 Checkout Session response:', data);

            if (!data.sessionUrl) {
                throw new Error('No checkout session URL received');
            }

            // ✅ Redirect to Stripe Checkout
            console.log('🔗 Redirecting to Stripe Checkout:', data.sessionUrl);
            
            // Store session info for potential webhook handling
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('stripe_session_id', data.sessionId);
                sessionStorage.setItem('appointment_id', appointmentId);
            }

            // Redirect to Stripe Checkout
            window.location.href = data.sessionUrl;

        } catch (err) {
            console.error('❌ Error during checkout:', err);
            message.error(err instanceof Error ? err.message : 'Unexpected error during checkout.');
            
            // ✅ 通知主窗口失败
            if (window.opener) {
                window.opener.postMessage({ type: 'paymentFailed' }, '*');
            }

            // ✅ 自动关闭 Stripe 支付页面
            setTimeout(() => {
                window.close();
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ 
                padding: '20px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                marginBottom: '16px'
            }}>
                <h3>Payment Summary</h3>
                <p><strong>Amount:</strong> ${(amount / 100).toFixed(2)}</p>
                <p><strong>Appointment ID:</strong> {appointmentId}</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                    You will be redirected to Stripe's secure checkout page to complete your payment.
                </p>
            </div>
            
            <Button type="primary" htmlType="submit" loading={loading} className="mt-4" style={{ width: '100%' }}>
                Proceed to Payment - ${(amount / 100).toFixed(2)}
            </Button>
        </form>
    );
}

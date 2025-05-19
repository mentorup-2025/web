'use client';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button, message } from 'antd';
import { supabase } from '../services/supabase';

export default function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const insertBookingAfterPayment = async () => {
        const bookingDataRaw = sessionStorage.getItem('bookingDetails');
        if (!bookingDataRaw) return;

        const bookingData = JSON.parse(bookingDataRaw);
        const [startTimeStr, endTimeStr] = bookingData.time.split(' - ');
        const startDateTime = `${bookingData.date} ${startTimeStr}`;
        const endDateTime = `${bookingData.date} ${endTimeStr}`;

        const { error } = await supabase.from('appointments').insert([
            {
                mentor_id: bookingData.mentorId,
                mentee_id: bookingData.menteeId,
                time_slot: [startDateTime, endDateTime],
                status: 'pending',
                service_type: bookingData.serviceType || 'Mock Interview',
                price: 0,
                extra_info: bookingData.description,
                resume_url: bookingData.resumeUrl || null,
            },
        ]);

        if (error) {
            console.error('Failed to insert appointment:', error);
            message.error('Appointment creation failed.');
        } else {
            message.success('Appointment confirmed!');
            sessionStorage.removeItem('bookingDetails');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        try {
            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });

            const { clientSecret } = await res.json();

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                message.error(result.error.message || 'Payment failed');
            } else if (result.paymentIntent?.status === 'succeeded') {
                message.success('Payment successful');
                await insertBookingAfterPayment();

                // ✅ 通知原窗口付款成功
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

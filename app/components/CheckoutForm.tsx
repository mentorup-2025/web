'use client';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button, message } from 'antd';
import { supabase } from '../lib/supabaseClient';

export default function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

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

            const { clientSecret, paymentIntentId } = await res.json();

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                message.error(result.error.message || 'Payment failed');
            } else if (result.paymentIntent?.status === 'succeeded') {
                message.success('Payment successful');

                // const { error } = await supabase.from('orders').insert([
                //     {
                //         amount,
                //         status: 'paid',
                //         payment_intent: paymentIntentId,
                //         created: new Date().toISOString(),
                //     },
                // ]);

                // if (error) {
                //     console.error('Supabase error:', error);
                //     message.warning('Payment succeeded, but failed to save order');
                // }
            }
        } catch (err: any) {
            console.error('Error:', err);
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

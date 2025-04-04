'use client';

import {
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { useState } from 'react';

interface CheckoutFormProps {
    amount: number;
}

export default function CheckoutForm({ amount }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }) // 使用传入的金额
            });

            const { clientSecret } = await response.json();

            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            window.location.href = '/payment/success';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* 信用卡输入区域 */}
            <div className="mb-6 border rounded-lg p-3 bg-gray-50">
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
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="text-red-500 mb-4 text-center">{error}</div>
            )}

            {/* 支付按钮 */}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-semibold text-lg"
            >
                {processing ? 'Processing Payment...' : `Pay $${(amount / 100).toFixed(2)}`}
            </button>
        </form>
    );
}
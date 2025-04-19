import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function YourPaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 从服务器请求 clientSecret
        const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: '当前登录用户的uuid' }), // 替换成实际值
        });

        const { clientSecret } = await res.json();

        const result = await stripe?.confirmPayment({
            elements: elements!,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success`,
            },
        });

        if (result?.error) {
            alert(result.error.message);
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={!stripe || loading}>
                {loading ? '处理中...' : '付款'}
            </button>
        </form>
    );
}

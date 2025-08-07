'use client';

import { useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../../components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentInner() {
    const searchParams = useSearchParams();

    const amountParam = searchParams?.get('amount');
    const appointmentId = searchParams?.get('appointmentId');

    const parsedAmount = amountParam ? parseInt(amountParam, 10) : null;
    const totalAmount = parsedAmount || 2000;

    return (
        <>
            <button
                onClick={() => window.close()}
                className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to previous
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h1>

            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                        ${(totalAmount).toFixed(2)}
                    </span>
                </div>
            </div>

            <Elements stripe={stripePromise}>
                <CheckoutForm 
                    amount={totalAmount}
                    appointmentId={appointmentId ?? undefined} 
                />
            </Elements>
        </>
    );
}

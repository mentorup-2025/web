'use client';

import Link from 'next/link';
import { Layout } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense } from 'react';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    useUser,
} from '@clerk/nextjs';
import CheckoutForm from '../../components/CheckoutForm';
import styles from '../../mentor/[id]/mentorDetails.module.css';
import NavBar from '../../components/Navbar';
import { useSearchParams } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
    const { user } = useUser();
    const searchParams = useSearchParams();

    // ✅ 从 URL 参数中获取金额和预约 ID
    const amountParam = searchParams?.get('amount');
    const appointmentId = searchParams?.get('appointmentId');

    const parsedAmount = amountParam ? parseInt(amountParam, 10) : null;
    const totalAmount = parsedAmount || 2000; // fallback 默认 2000（$20）



    return (
        <Layout className={styles.layout} style={{ minHeight: '100vh', background: 'white' }}>
            <NavBar />
            <Layout.Content className="p-4">
                <div className="bg-white flex flex-col items-center justify-center p-4 pt-40">
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

                        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="text-xl font-bold text-blue-600">
                  ${(totalAmount / 100).toFixed(2)}
                </span>
                            </div>
                        </div>

                        {/* Stripe 付款表单 */}
                        <Elements stripe={stripePromise}>
                            <Suspense fallback={<div className="text-center py-4">Loading payment form...</div>}>
                                <CheckoutForm amount={totalAmount} appointmentId={appointmentId ?? undefined} />
                            </Suspense>
                        </Elements>
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
}

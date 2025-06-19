'use client';

import Link from 'next/link';
import { Layout, Button } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense, useState } from 'react';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
    useUser,
} from '@clerk/nextjs';
import CheckoutForm from '../../components/CheckoutForm';
import styles from '../../mentor/[id]/mentorDetails.module.css'; // 使用 MentorDetails 的样式

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LESSON_PRICE = 2000; // $20.00

export default function PaymentPage() {
    const { user, isSignedIn } = useUser();
    const [lessonCount, setLessonCount] = useState(1);
    const [totalAmount, setTotalAmount] = useState(LESSON_PRICE);

    const handleCountChange = (operation: 'increment' | 'decrement') => {
        let newCount = lessonCount;
        if (operation === 'increment') {
            newCount += 1;
        } else {
            newCount = Math.max(1, lessonCount - 1);
        }
        setLessonCount(newCount);
        setTotalAmount(newCount * LESSON_PRICE);
    };

    return (
        <Layout className={styles.layout} style={{ minHeight: '100vh', background: 'white' }}>

        {/* 顶栏 Header */}
            <Layout.Header className={styles.header}>
                <div className={styles.leftGroup}>
                    <Link href="/" className={styles.logo}>MentorUp</Link>
                    <Link href="/mentors" className={styles.link}>Our Mentors</Link>
                </div>
                <div className={styles.rightGroup}>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button type="primary" className={styles.becomeBtn}>Become a Mentor</Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Button
                            type="primary"
                            className={styles.becomeBtn}
                            onClick={() => user && window.location.assign(`/signup/mentor/${user.id}`)}
                        >
                            Become a Mentor
                        </Button>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button type="default" style={{ marginLeft: '10px' }}>Sign In</Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </Layout.Header>

            {/* 内容区 */}
            <Layout.Content className="p-4">
                <div className="bg-white flex flex-col items-center justify-center p-4 pt-40"> {/* pt-40 框往下的位置 */}

                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
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
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-700">Number of Lessons</span>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleCountChange('decrement')}
                                        disabled={lessonCount === 1}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center 
                      ${lessonCount === 1 ? 'bg-gray-200' : 'bg-blue-500 hover:bg-blue-600'} 
                      text-white transition-colors`}
                                    >
                                        -
                                    </button>
                                    <span className="mx-4 text-xl font-semibold">{lessonCount}</span>
                                    <button
                                        onClick={() => handleCountChange('increment')}
                                        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Unit Price:</span>
                                <span className="font-semibold">${(LESSON_PRICE / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="text-xl font-bold text-blue-600">
                  ${(totalAmount / 100).toFixed(2)}
                </span>
                            </div>
                        </div>

                        <Elements stripe={stripePromise}>
                            <Suspense fallback={<div className="text-center py-4">Loading payment form...</div>}>
                                <CheckoutForm amount={totalAmount} />
                            </Suspense>
                        </Elements>
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
}

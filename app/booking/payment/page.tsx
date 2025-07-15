'use client';

import { Layout } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../../mentor/[id]/mentorDetails.module.css';
import NavBar from '../../components/Navbar';
import { Suspense } from 'react';
import PaymentInner from './PaymentInner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
    return (
        <Layout className={styles.layout} style={{ minHeight: '100vh', background: 'white' }}>
            <NavBar />
            <Layout.Content className="p-4">
                <div className="bg-white flex flex-col items-center justify-center p-4 pt-40">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                        <Suspense fallback={<div className="text-center py-4">Loading payment page...</div>}>
                            <PaymentInner />
                        </Suspense>
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
}

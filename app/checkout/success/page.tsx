'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Mark the page as dynamic
export const dynamic = 'force-dynamic';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-gray-600">Thank you for your purchase.</p>
      <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
} 
'use client';

import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-gray-600">Thank you for your purchase.</p>
      <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
    </div>
  );
} 
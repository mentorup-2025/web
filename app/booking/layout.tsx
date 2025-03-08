'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 h-14 items-center">
            <Link 
              href="/booking/calendar"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/booking/calendar' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Calendar
            </Link>
            <Link 
              href="/booking/slots"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/booking/time-slots' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Time Slots
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
} 
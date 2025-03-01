'use client';

import BookingCalendar from './components/BookingCalendar';

export default function BookingPOC() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Booking Calendar POC</h1>
      <div className="h-[600px]">
        <BookingCalendar />
      </div>
    </div>
  );
} 
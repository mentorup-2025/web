'use client';

import TimeSlotSelector from '../components/TimeSlotSelector';

export default function TimeSlotPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Available Time Slots
        </h1>
        <TimeSlotSelector />
      </div>
    </div>
  );
} 
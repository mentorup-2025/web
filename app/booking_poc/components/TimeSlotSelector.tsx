'use client';

import { useState } from 'react';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  id: string;
}

export default function TimeSlotSelector() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Generate time options (1-hour slots from 9 AM to 5 PM)
  const timeOptions = Array.from({ length: 8 }, (_, i) => {
    const hour = i + 9;
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    return {
      value: startTime,
      label: `${startTime} - ${endTime}`,
      endTime: endTime
    };
  });

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      id: Date.now().toString(),
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, field: 'date' | 'startTime', value: string) => {
    setTimeSlots(
      timeSlots.map(slot => {
        if (slot.id === id) {
          if (field === 'startTime') {
            const selectedOption = timeOptions.find(opt => opt.value === value);
            return {
              ...slot,
              startTime: value,
              endTime: selectedOption?.endTime || slot.endTime
            };
          }
          return { ...slot, [field]: value };
        }
        return slot;
      })
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Select Your Available Time Slots</h2>
      
      <div className="space-y-4">
        {timeSlots.map((slot, index) => (
          <div key={slot.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-700 font-medium w-8">{index + 1}.</span>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
              className="border rounded-md px-3 py-2 flex-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              required
            />
            <select
              value={slot.startTime}
              onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
              className="border rounded-md px-3 py-2 w-48 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
            >
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value} className="text-gray-900">
                  {time.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeTimeSlot(slot.id)}
              className="text-red-500 hover:text-red-700 px-2 hover:bg-red-50 rounded-full h-8 w-8 flex items-center justify-center"
              aria-label="Remove time slot"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <button
          onClick={addTimeSlot}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors w-full font-medium"
        >
          + Add Time Slot
        </button>

        {timeSlots.length > 0 && (
          <button
            onClick={() => console.log('Selected time slots:', timeSlots)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full font-medium"
          >
            Save Time Slots (todo)
          </button>
        )}
      </div>
    </div>
  );
} 
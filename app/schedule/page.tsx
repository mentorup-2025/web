'use client';

import { useState } from 'react';
import { Calendar, Button, Tag, Modal } from 'antd';
import { Select } from 'antd';

export default function MentorProfilePage() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const timeSlots = ['4-5 PM', '4-5 PM', '4-5 PM'];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Sidebar */}
            <div className="w-1/4 bg-gray-200 p-6 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-400 rounded-full mb-4"></div>
                <div className="flex space-x-2 mb-4">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <div className="w-6 h-6 bg-gray-800 rounded"></div>
                </div>
                <h2 className="text-lg font-semibold">Name Name</h2>
                <p className="text-gray-600">Job Title title</p>
                <div className="mt-6 w-full">
                    <p><span className="font-semibold">Company:</span></p>
                    <p><span className="font-semibold">Industry:</span></p>
                    <p><span className="font-semibold">YoE:</span></p>
                    <p><span className="font-semibold">Language:</span></p>
                    <p><span className="font-semibold">Gender:</span></p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="bg-gray-200 p-6 rounded mb-6">
                    <h2 className="text-xl font-semibold mb-2">About</h2>
                    <div className="h-24 bg-gray-300 rounded"></div>
                </div>

                <div className="bg-gray-200 p-6 rounded mb-6">
                    <h2 className="text-xl font-semibold mb-4">Services</h2>
                    <div className="flex flex-wrap gap-2">
                        {Array(9).fill(0).map((_, i) => (
                            <Tag closable key={i}>Tag {i % 3 + 1}</Tag>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-200 p-6 rounded border-dashed border-2">
                    <h2 className="text-xl font-semibold">Experience</h2>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-1/4 p-6">
                <div className="mb-6">
                    <Calendar fullscreen={false} onSelect={(value) => setSelectedDate(value)} />
                </div>

                <div className="flex flex-col space-y-2 mb-6">
                    {timeSlots.map((slot, index) => (
                        <Button
                            key={index}
                            className="flex items-center justify-center"
                            onClick={() => setSelectedTime(slot)}
                        >
                            {slot}
                            <span className="ml-2 text-green-500">●</span>
                        </Button>
                    ))}
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <p className="text-blue-600 text-lg font-semibold">$30/h</p>
                </div>

                <Button type="primary" className="w-full">Schedule</Button>
            </div>
        </div>
    );
}

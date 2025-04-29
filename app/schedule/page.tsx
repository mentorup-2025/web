'use client';

import { useState } from 'react';
import { Calendar, Button, Tag, Modal, Input, message, Dropdown, Avatar } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Select } from 'antd';

export default function MentorProfilePage() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');

    const timeSlots = ['4-5 PM', '4-5 PM', '4-5 PM'];

    const handleSchedule = () => {
        if (!selectedDate || !selectedTime) {
            message.warning('Please select a date and time first.');
            return;
        }
        setIsScheduleModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar */}
            <div className="w-full bg-black text-white flex items-center justify-between px-6 py-3">
                <div className="flex items-center space-x-4">
                    <div className="text-xl font-bold">Logo</div>
                    <input
                        type="text"
                        placeholder="Search"
                        className="px-2 py-1 rounded text-black"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <Button type="primary" className="bg-blue-500 border-none">Become a mentor</Button>
                    <Avatar size="large" className="bg-gray-400">L</Avatar>
                </div>
            </div>

            {/* Main Body */}
            <div className="flex flex-1">
                {/* Left Sidebar */}
                <div className="w-1/4 bg-gray-200 p-6 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-400 rounded-full mb-4"></div>
                    <div className="flex space-x-2 mb-4">
                        <div className="w-6 h-6 bg-blue-500 rounded"></div>
                        <div className="w-6 h-6 bg-gray-800 rounded"></div>
                    </div>
                    <h2 className="text-lg font-semibold">Name Name</h2>
                    <p className="text-gray-600">Job Title title</p>
                    <div className="mt-6 w-full space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Company:</span>
                            <button onClick={() => setIsEditingCompany(true)} className="text-gray-600">
                                ✏️
                            </button>
                        </div>
                        {isEditingCompany ? (
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                onPressEnter={() => setIsEditingCompany(false)}
                                onBlur={() => setIsEditingCompany(false)}
                                size="small"
                                className="mt-1"
                            />
                        ) : (
                            <p>{companyName || 'Not set'}</p>
                        )}
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
                        <div className="grid grid-cols-4 gap-2">
                            {Array(12).fill(0).map((_, i) => (
                                <Tag closable key={i} className="flex justify-center">Tag {i % 3 + 1}</Tag>
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
                                type={selectedTime === slot ? 'primary' : 'default'}
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

                    <Button type="primary" className="w-full" onClick={handleSchedule}>Schedule</Button>

                    <Modal
                        title="Confirm Schedule"
                        open={isScheduleModalOpen}
                        onOk={() => { setIsScheduleModalOpen(false); message.success('Scheduled successfully!'); }}
                        onCancel={() => setIsScheduleModalOpen(false)}
                        okText="Confirm"
                    >
                        <p>You selected:</p>
                        <p className="font-semibold">{selectedDate ? selectedDate.format('YYYY-MM-DD') : ''} at {selectedTime}</p>
                    </Modal>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, Calendar, Button, List, Typography, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import styles from './mentorAvailability.module.css';

dayjs.extend(utc);
const { Text } = Typography;

interface TimeSlot {
    slot_time: string;
}

interface AvailabilityResponse {
    code: number;
    message: string;
    data: TimeSlot[];
}

interface MentorAvailabilityProps {
    mentorId: string | number;
    onSlotSelect: (date: string, time: string) => void;
    onBook: () => void;
}

export default function MentorAvailability({
                                               mentorId,
                                               onSlotSelect,
                                               onBook,
                                           }: MentorAvailabilityProps) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availabilityData, setAvailabilityData] = useState<Map<string, string[]>>(new Map());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

    useEffect(() => {
        const fetchAvailability = async () => {
            const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
            const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

            try {
                const response = await fetch(
                    `/api/availability/${mentorId}/view?start_date=${startDate}&end_date=${endDate}`
                );
                const data: AvailabilityResponse = await response.json();

                if (data.code === 0) {
                    const availabilityMap = new Map<string, string[]>();
                    data.data.forEach(({ slot_time }) => {
                        const cleanSlotTime = slot_time.replace(/[\[\]"]/g, '');
                        const [start, end] = cleanSlotTime.split(',');

                        const startTime = dayjs(start);
                        const endTime = dayjs(end.replace(')', ''));

                        const dateKey = startTime.format('YYYY-MM-DD');
                        const timeSlot = `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;

                        if (!availabilityMap.has(dateKey)) {
                            availabilityMap.set(dateKey, []);
                        }
                        availabilityMap.get(dateKey)!.push(timeSlot);
                    });

                    setAvailabilityData(availabilityMap);
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
            }
        };

        fetchAvailability();
    }, [currentMonth, mentorId]);

    const dateCellRender = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        const hasSlots = availabilityData.has(dateStr);
        return hasSlots ? (
            <div
                className={styles.availabilityDot}
                onClick={(e) => e.stopPropagation()} // 防止事件冒泡干扰
            />
        ) : null;
    };

    const handleDateSelect = (date: Dayjs) => {
        console.log('Date selected:', date.format('YYYY-MM-DD'));
        const dateStr = date.format('YYYY-MM-DD');
        if (availabilityData.has(dateStr)) {
            setSelectedDate(date);
            setSelectedSlot(null);
        } else {
            setSelectedDate(null);
            setSelectedSlot(null);
        }
    };

    const handlePanelChange = (date: Dayjs) => {
        console.log('Panel changed to:', date.format('YYYY-MM'));
        setCurrentMonth(date);
        setSelectedDate(null); // 清空选中日期
        setSelectedSlot(null);
    };

    const headerRender = ({ value }: { value: Dayjs }) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return (
            <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Button
                        onClick={() => handlePanelChange(value.subtract(1, 'month'))}
                        style={{ marginRight: 8 }}
                    >
                        {'<'}
                    </Button>
                    <span style={{ fontWeight: 'normal' }}>{months[value.month()]}</span>
                    <Button
                        onClick={() => handlePanelChange(value.add(1, 'month'))}
                        style={{ marginLeft: 8 }}
                    >
                        {'>'}
                    </Button>
                </div>
                <Select
                    size="small"
                    value={value.year()}
                    options={Array.from({ length: 10 }, (_, i) => ({
                        label: value.year() - 5 + i,
                        value: value.year() - 5 + i,
                    }))}
                    onChange={(newYear) => {
                        handlePanelChange(value.year(newYear));
                    }}
                    style={{ width: 100 }}
                />
            </div>
        );
    };

    return (
        <Card title="Mentor's Availability" className={styles.availabilityCard}>
            <Calendar
                fullscreen={false}
                onSelect={handleDateSelect}
                onPanelChange={handlePanelChange}
                dateCellRender={dateCellRender}
                headerRender={headerRender}
                value={selectedDate || currentMonth}
                className={styles.calendar}
            />

            {selectedDate && availabilityData.has(selectedDate.format('YYYY-MM-DD')) && (
                <div className={styles.timeSlots}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Available Time Slots on {selectedDate.format('MMMM D, YYYY')}
                    </Text>
                    <List
                        size="small"
                        dataSource={availabilityData.get(selectedDate.format('YYYY-MM-DD')) || []}
                        renderItem={(slot) => (
                            <List.Item
                                className={`${styles.timeSlot} ${selectedSlot === slot ? styles.selected : ''}`}
                                onClick={() => {
                                    console.log('Slot selected:', slot);
                                    setSelectedSlot(slot);
                                }}
                            >
                                {slot}
                            </List.Item>
                        )}
                    />
                </div>
            )}

            <Button
                type="primary"
                block
                disabled={!selectedDate || !selectedSlot}
                className={styles.scheduleButton}
                onClick={() => {
                    if (selectedDate && selectedSlot) {
                        console.log('Booking:', selectedDate.format('YYYY-MM-DD'), selectedSlot);
                        onSlotSelect(selectedDate.format('YYYY-MM-DD'), selectedSlot);
                        onBook();
                    }
                }}
            >
                Book
            </Button>
        </Card>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, Calendar, Button, Typography, Select, message } from 'antd';
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
                console.log('API Response:', data);

                if (data.code === 0) {
                    const availabilityMap = new Map<string, string[]>();
                    data.data.forEach(({ slot_time }) => {
                        try {
                            let start: string, end: string;
                            if (slot_time.startsWith('[')) {
                                const cleanSlotTime = slot_time.replace(/[\[\]"]/g, '');
                                [start, end] = cleanSlotTime.split(',');
                                end = end.replace(')', '');
                            } else {
                                const parsed = JSON.parse(slot_time);
                                [start, end] = parsed;
                            }

                            const startTime = dayjs(start);
                            const endTime = dayjs(end);

                            if (!startTime.isValid() || !endTime.isValid()) return;

                            const dateKey = startTime.format('YYYY-MM-DD');
                            const timeSlot = `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;

                            if (!availabilityMap.has(dateKey)) {
                                availabilityMap.set(dateKey, []);
                            }
                            availabilityMap.get(dateKey)!.push(timeSlot);
                        } catch (error) {
                            console.error('Error processing slot_time:', slot_time, error);
                        }
                    });
                    setAvailabilityData(availabilityMap);
                } else {
                    console.error('API Error:', data.message);
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
        return hasSlots ? <div className={styles.availabilityDot} /> : null;
    };

    const handleDateSelect = (date: Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        setSelectedDate(date);
        setSelectedSlot(null);
        if (!availabilityData.has(dateStr)) {
            message.warning('No available time slots for this date.');
        }
    };

    const handlePanelChange = (date: Dayjs) => {
        setCurrentMonth(date);
        setSelectedDate(null);
        setSelectedSlot(null);
    };

    const headerRender = ({ value }: { value: Dayjs }) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (
            <div className={styles.calendarHeader}>
                <Button onClick={() => handlePanelChange(value.subtract(1, 'month'))} className={styles.navButton}>
                    {'<'}
                </Button>
                <span className={styles.monthText}>{months[value.month()]}</span>
                <Button onClick={() => handlePanelChange(value.add(1, 'month'))} className={styles.navButton}>
                    {'>'}
                </Button>
                <Select
                    size="small"
                    value={value.year()}
                    options={Array.from({ length: 10 }, (_, i) => ({
                        label: value.year() - 5 + i,
                        value: value.year() - 5 + i,
                    }))}
                    onChange={(newYear) => handlePanelChange(value.year(newYear))}
                    className={styles.yearSelect}
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

            {selectedDate && (
                <div className={styles.timeSlots}>
                    <Text strong className={styles.timeSlotsTitle}>
                        Available Time Slots on {selectedDate.format('MMMM D, YYYY')}
                    </Text>
                    {availabilityData.has(selectedDate.format('YYYY-MM-DD')) ? (
                        availabilityData.get(selectedDate.format('YYYY-MM-DD'))!.map((slot, i) => {
                            const [startStr] = slot.split(' - ');
                            const slotDateTime = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);
                            const isDisabled = slotDateTime.isBefore(dayjs().add(24, 'hour'));

                            return (
                                <Button
                                    key={i}
                                    type={selectedSlot === slot ? 'primary' : 'default'}
                                    onClick={() => {
                                        if (isDisabled) {
                                            message.warning('You can only book slots at least 24 hours in advance.');
                                            return;
                                        }
                                        setSelectedSlot(slot);
                                    }}
                                    disabled={isDisabled}
                                    className={styles.timeSlotButton}
                                >
                                    {slot}
                                </Button>
                            );
                        })
                    ) : (
                        <Text className={styles.noSlotsText}>No available time slots.</Text>
                    )}
                </div>
            )}

            <Button
                type="primary"
                block
                disabled={!selectedDate || !selectedSlot}
                className={styles.scheduleButton}
                onClick={() => {
                    if (selectedDate && selectedSlot) {
                        const [startStr] = selectedSlot.split(' - ');
                        const slotDateTime = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);
                        if (slotDateTime.isBefore(dayjs().add(24, 'hour'))) {
                            message.error('Cannot book less than 24 hours in advance.');
                            return;
                        }
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

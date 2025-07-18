'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Calendar,
    Button,
    Typography,
    Select,
    message,
    Radio,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import styles from './mentorAvailability.module.css';
import { supabase } from '../../services/supabase';
import { ClockCircleOutlined } from '@ant-design/icons';

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

interface Service {
    type: string;
    price: number;
}

interface MentorAvailabilityProps {
    mentorId: string | number;
    services: Service[];
    onSlotSelect: (date: string, time: string) => void;
    onBook: () => void;
}

export default function MentorAvailability({
                                               mentorId,
                                               services,
                                               onSlotSelect,
                                               onBook,
                                           }: MentorAvailabilityProps) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availabilityData, setAvailabilityData] = useState<Map<string, string[]>>(new Map());
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [heldSlots, setHeldSlots] = useState<Set<string>>(new Set());
    const [userTimezone, setUserTimezone] = useState('');

    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz);
    }, []);

    useEffect(() => {
        const fetchAvailability = async () => {
            const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
            const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

            try {
                const response = await fetch(
                    `/api/availability/${mentorId}/view?start_date=${startDate}&end_date=${endDate}`
                );
                const data: AvailabilityResponse = await response.json();

                const { data: holdData, error: holdError } = await supabase
                    .from('temp_holds')
                    .select('time_slot')
                    .eq('mentor_id', mentorId)
                    .is('expires_at', null);

                const held = new Set<string>();
                if (!holdError && holdData) {
                    for (const item of holdData) {
                        const clean = item.time_slot.replace(/[\[\]()"]/g, '').split(',');
                        const start = dayjs(clean[0]);
                        const end = dayjs(clean[1]);
                        const dateKey = start.format('YYYY-MM-DD');
                        const slotLabel = `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
                        held.add(`${dateKey}|${slotLabel}`);
                    }
                }
                setHeldSlots(held);

                if (data.code === 0) {
                    const availabilityMap = new Map<string, string[]>();
                    const nowPlus24h = dayjs().add(24, 'hour');

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
                            if (startTime.isBefore(nowPlus24h)) return;

                            const dateKey = startTime.format('YYYY-MM-DD');
                            const timeSlot = `${startTime.format('h:mm A')} - ${endTime.format('h:mm A')}`;

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
        return availabilityData.has(dateStr) ? <div className={styles.availabilityDot} /> : null;
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
            <div className={styles.calendarHeaderWrapper}>
                <div className={styles.timezoneText}>
                    <span role="img" aria-label="globe">🌐</span>{' '}
                    <strong>(GMT{dayjs().format('Z')}) {userTimezone}</strong>
                </div>
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
            </div>
        );
    };

    return (
        <Card className={styles.availabilityCard}>
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

                    <div style={{
                        backgroundColor: '#f9f9ff',
                        borderLeft: '4px solid #1890ff',
                        padding: '12px 16px',
                        borderRadius: 4,
                        margin: '8px 0 16px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}>
                        <div style={{ color: '#1890ff', fontWeight: 600, fontSize: 14 }}>
                            <span role="img" aria-label="megaphone">📣</span> Your first 15-min coffee chat is on us!
                        </div>
                        <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>
                            Pick any available slot — your session will take place in the first 15 min.
                        </div>
                    </div>

                    {availabilityData.has(selectedDate.format('YYYY-MM-DD')) ? (
                        <>
                            <Radio.Group
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                                className={styles.radioGroup}
                            >
                                {availabilityData.get(selectedDate.format('YYYY-MM-DD'))!.map((slot, i) => {
                                    const [startStr, endStr] = slot.split(' - ');
                                    const start = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${startStr}`);
                                    const end = dayjs(`${selectedDate.format('YYYY-MM-DD')} ${endStr}`);
                                    const durationMinutes = end.diff(start, 'minute');
                                    const durationText = durationMinutes >= 60
                                        ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ''}`
                                        : `${durationMinutes}m`;

                                    const price = services?.[0]?.price
                                        ? `$${(services[0].price).toFixed(2)}`
                                        : '$--';

                                    const slotKey = `${selectedDate.format('YYYY-MM-DD')}|${slot}`;
                                    const isDisabled = start.isBefore(dayjs().add(24, 'hour')) || heldSlots.has(slotKey);

                                    return (
                                        <Radio
                                            key={i}
                                            value={slot}
                                            disabled={isDisabled}
                                            className={styles.timeSlotRadio}
                                        >
                                            <div className={styles.radioContent}>
                                                <span className={styles.slotText}>{slot}</span>
                                                <span className={styles.slotDetails}>({durationText}) {price}</span>
                                            </div>
                                        </Radio>
                                    );
                                })}
                            </Radio.Group>

                            <Button
                                type="primary"
                                block
                                disabled={!selectedSlot}
                                className={styles.scheduleButton}
                                style={{ marginTop: 20 }}
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
                                Book Now
                            </Button>
                        </>
                    ) : (
                        <Text className={styles.noSlotsText}>No available time slots.</Text>
                    )}
                </div>
            )}
        </Card>
    );
}

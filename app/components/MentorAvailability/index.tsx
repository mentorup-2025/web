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
            availabilityMap.get(dateKey)?.push(timeSlot);
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
    return hasSlots ? <div className={styles.availabilityDot} /> : null;
  };

  const handleDateSelect = (date: Dayjs) => {
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
    setCurrentMonth(date);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const headerRender = ({ value, onChange }: { value: Dayjs; onChange: (date: Dayjs) => void }) => {
    if (!value) return null; // 安全保护

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = value.year();
    const month = value.month();

    const options = [];
    for (let i = year - 10; i < year + 10; i += 1) {
      options.push({
        label: i,
        value: i,
      });
    }

    return (
        <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button
                style={{ marginRight: '8px' }}
                onClick={() => onChange(value.clone().subtract(1, 'month'))}
            >
              {'<'}
            </Button>
            <span style={{ margin: '0 8px' }}>{months[month]}</span>
            <Button
                style={{ marginLeft: '8px' }}
                onClick={() => onChange(value.clone().add(1, 'month'))}
            >
              {'>'}
            </Button>
          </div>
          <Select
              size="small"
              value={year}
              options={options}
              onChange={(newYear) => {
                const now = value.clone().year(newYear);
                onChange(now);
              }}
          />
        </div>
    );
  };

  return (
      <Card title="Mentor's Availability" className={styles.availabilityCard}>
        <Calendar
            fullscreen={false}
            onChange={handleDateSelect}
            onPanelChange={handlePanelChange}
            dateCellRender={dateCellRender}
            headerRender={headerRender}
            value={selectedDate || dayjs()} // 确保有默认值
            className={styles.calendarHeader}
        />

        {selectedDate && availabilityData.has(selectedDate.format('YYYY-MM-DD')) && (
            <div className={styles.timeSlots}>
              <Text strong>Available Time Slots</Text>
              <List
                  size="small"
                  className={styles.timeSlotsList}
                  dataSource={availabilityData.get(selectedDate.format('YYYY-MM-DD')) || []}
                  renderItem={(slot) => (
                      <List.Item
                          className={`${styles.timeSlot} ${selectedSlot === slot ? styles.selected : ''}`}
                          onClick={() => setSelectedSlot(slot)}
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
                console.log('Selected Date:', selectedDate?.format('YYYY-MM-DD'));
                console.log('Selected Slot:', selectedSlot);
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
'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TimeSlot {
  start: Date;
  end: Date;
  title: string;
}

interface OneHourSegment {
  eventIndex: number;
  start: Date;
  end: Date;
}

function formatHour(hour: number): string {
  const h = hour % 12;
  const displayHour = h === 0 ? 12 : h;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${ampm}`;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i, // startHour
  label: `${formatHour(i)} - ${formatHour((i + 1) % 24)}`,
}));

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    try {
      const storedSlots = localStorage.getItem('events');
      if (storedSlots) {
        const parsedSlots = JSON.parse(storedSlots);
        if (Array.isArray(parsedSlots)) {
          const rehydratedSlots = parsedSlots.map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));
          setTimeSlots(rehydratedSlots);
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events in TimeSlots:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  const getAllSegments = (): OneHourSegment[] => {
    const segments: OneHourSegment[] = [];

    timeSlots.forEach((slot, eventIndex) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);

      while (startDate < endDate) {
        const nextDate = new Date(startDate);
        nextDate.setHours(startDate.getHours() + 1);
        if (nextDate > endDate) break;

        segments.push({
          eventIndex,
          start: new Date(startDate),
          end: new Date(nextDate),
        });

        startDate.setHours(startDate.getHours() + 1);
      }
    });

    return segments;
  };

  const getSelectedHourOptionIndex = (seg: OneHourSegment) => {
    return seg.start.getHours(); // 假设 seg.end = seg.start + 1h
  };

  const handleDateChange = (seg: OneHourSegment, newDate: Date) => {
    const startHour = seg.start.getHours();
    const endHour = seg.end.getHours();

    const newStart = new Date(newDate);
    newStart.setHours(startHour, 0, 0, 0);

    const newEnd = new Date(newDate);
    newEnd.setHours(endHour, 0, 0, 0);

    updateEventTimeRange(seg.eventIndex, seg.start, seg.end, newStart, newEnd);
  };

  const handleHourChange = (seg: OneHourSegment, newHourValue: number) => {
    const dateOnly = new Date(seg.start);
    dateOnly.setHours(0, 0, 0, 0);

    const newStart = new Date(dateOnly);
    newStart.setHours(newHourValue, 0, 0, 0);

    const newEnd = new Date(dateOnly);
    newEnd.setHours((newHourValue + 1) % 24, 0, 0, 0);

    updateEventTimeRange(seg.eventIndex, seg.start, seg.end, newStart, newEnd);
  };

  const updateEventTimeRange = (
    eventIndex: number,
    oldSegStart: Date,
    oldSegEnd: Date,
    newSegStart: Date,
    newSegEnd: Date
  ) => {
    const updated = [...timeSlots];
    const slot = updated[eventIndex];

    const splitted: { start: Date; end: Date }[] = [];
    let cur = new Date(slot.start);
    while (cur < slot.end) {
      const nxt = new Date(cur);
      nxt.setHours(cur.getHours() + 1);
      if (nxt > slot.end) break;
      splitted.push({ start: new Date(cur), end: new Date(nxt) });
      cur.setHours(cur.getHours() + 1);
    }

    for (let i = 0; i < splitted.length; i++) {
      if (
        splitted[i].start.getTime() === oldSegStart.getTime() &&
        splitted[i].end.getTime() === oldSegEnd.getTime()
      ) {
        splitted[i] = { start: newSegStart, end: newSegEnd };
        break;
      }
    }

    splitted.sort((a, b) => a.start.getTime() - b.start.getTime());

    if (splitted.length > 0) {
      slot.start = splitted[0].start;
      slot.end = splitted[splitted.length - 1].end;
      updated[eventIndex] = slot;
    } else {
      updated.splice(eventIndex, 1);
    }

    setTimeSlots(updated);
    localStorage.setItem('events', JSON.stringify(updated));
  };

  const handleDeleteEvent = (eventIndex: number) => {
    const updated = timeSlots.filter((_, i) => i !== eventIndex);
    setTimeSlots(updated);
    localStorage.setItem('events', JSON.stringify(updated));
    if (updated.length === 0 && window.confirm('Clear event data from local storage?')) {
      localStorage.removeItem('events');
    }
  };

  const handleDeleteSegment = (seg: OneHourSegment) => {
    const eventIndex = seg.eventIndex;
    const updated = [...timeSlots];
    const slot = updated[eventIndex];

    const splitted: { start: Date; end: Date }[] = [];
    let cur = new Date(slot.start);
    while (cur < slot.end) {
      const nxt = new Date(cur);
      nxt.setHours(cur.getHours() + 1);
      if (nxt > slot.end) break;
      splitted.push({ start: new Date(cur), end: new Date(nxt) });
      cur.setHours(cur.getHours() + 1);
    }

    const filtered = splitted.filter(
      (s) =>
        !(s.start.getTime() === seg.start.getTime() && s.end.getTime() === seg.end.getTime())
    );

    if (filtered.length === 0) {
      updated.splice(eventIndex, 1);
    } else {
      filtered.sort((a, b) => a.start.getTime() - b.start.getTime());
      slot.start = filtered[0].start;
      slot.end = filtered[filtered.length - 1].end;
      updated[eventIndex] = slot;
    }

    setTimeSlots(updated);
    localStorage.setItem('events', JSON.stringify(updated));

    if (updated.length === 0 && window.confirm('Clear event data from local storage?')) {
      localStorage.removeItem('events');
    }
  };

  const segments = getAllSegments();

  const groupedByEvent: Record<number, OneHourSegment[]> = {};
  segments.forEach((seg) => {
    if (!groupedByEvent[seg.eventIndex]) {
      groupedByEvent[seg.eventIndex] = [];
    }
    groupedByEvent[seg.eventIndex].push(seg);
  });

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Select Your Available Time Slots
      </h2>

      {timeSlots.map((slot, eventIndex) => {
        const segs = groupedByEvent[eventIndex] || [];
        if (segs.length === 0) {
          return null;
        }

        return (
          <div
            key={eventIndex}
            style={{
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '1px solid #ccc',
            }}
          >
            <h3>
              Event {eventIndex + 1} - (Title: {slot.title || 'No Title'})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {segs.map((seg, idx) => {
                  const selectedHour = getSelectedHourOptionIndex(seg);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{idx + 1}</td>
                      <td style={{ padding: '8px' }}>
                        <DatePicker
                          selected={seg.start}
                          onChange={(date: Date) => handleDateChange(seg, date)}
                          dateFormat="MMMM d, yyyy"
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={selectedHour}
                          onChange={(e) =>
                            handleHourChange(seg, parseInt(e.target.value))
                          }
                          style={{ padding: '4px', fontSize: '14px' }}
                        >
                          {hourOptions.map((opt, i) => (
                            <option key={i} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        
                        <button
                          onClick={() => handleDeleteSegment(seg)}
                          style={{
                            backgroundColor: '#f0ad4e',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '8px',
                          }}
                        >
                          Delete This Hour
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            
            <button
              onClick={() => handleDeleteEvent(eventIndex)}
              style={{
                marginTop: '10px',
                backgroundColor: '#d9534f',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete Event
            </button>
          </div>
        );
      })}
    </div>
  );
}

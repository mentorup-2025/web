'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useRouter } from 'next/navigation';

const localizer = momentLocalizer(moment);

interface Event {
  start: Date;
  end: Date;
  title: string;
}

export default function MyCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const rehydrated = parsed.map((e: any) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }));
          setEvents(rehydrated);
        }
      }
    } catch (error) {
      console.error('Error parsing localStorage events:', error);
      localStorage.setItem('events', JSON.stringify([]));
    }
  }, []);

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const title = window.prompt('Enter event title');
    if (title) {
      const newEvent = { start, end, title };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
    }
  };

  const handleViewSelection = () => {
    router.push('/slots');
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="week"
        views={['week']}
        step={60}
        showMultiDayTimes
        style={{ height: 500 }}
      />
      <button onClick={handleViewSelection}>View Time Slots</button>
    </div>
  );
}

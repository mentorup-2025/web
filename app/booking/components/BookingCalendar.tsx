'use client';

import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TimeSlot {
  start: Date;
  end: Date;
  title: string;
}

export default function BookingCalendar() {
  const [events, setEvents] = useState<TimeSlot[]>([]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newEvent: TimeSlot = {
      start: slotInfo.start,
      end: slotInfo.end,
      title: 'Available',
    };

    // Check if the slot is already marked as available
    const isSlotTaken = events.some(
      (event) =>
        event.start.getTime() === newEvent.start.getTime() &&
        event.end.getTime() === newEvent.end.getTime()
    );

    if (isSlotTaken) {
      // Remove the event if it exists
      setEvents(events.filter(
        (event) =>
          event.start.getTime() !== newEvent.start.getTime() ||
          event.end.getTime() !== newEvent.end.getTime()
      ));
    } else {
      // Add the new event
      setEvents([...events, newEvent]);
    }
  };

  return (
    <div className="h-full [&_.rbc-header]:text-gray-900 [&_.rbc-time-header-content]:text-gray-900 [&_.rbc-label]:text-gray-900 [&_.rbc-event]:!bg-green-600 [&_.rbc-event]:!text-white [&_.rbc-today]:!bg-blue-50">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        step={30}
        timeslots={2}
        defaultView="week"
        views={['week']}
        min={new Date(0, 0, 0, 9, 0, 0)} // 9:00 AM
        max={new Date(0, 0, 0, 17, 0, 0)} // 5:00 PM
        eventPropGetter={() => ({
          style: {
            backgroundColor: '#16a34a', // green-600
            color: 'white',
            border: 'none'
          },
        })}
        className="text-gray-900"
      />
    </div>
  );
}
 
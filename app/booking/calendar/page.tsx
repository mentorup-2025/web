
import MyCalendar from '../components/calender';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Booking Calendar</h1>
      <div className="h-[600px] bg-white rounded-lg shadow-md p-4">
        <MyCalendar />
      </div>
    </div>
  );
}


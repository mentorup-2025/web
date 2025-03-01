import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <main className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">
          Welcome to Booking System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A simple and efficient way to manage your availability and bookings
        </p>
        <div className="space-y-4">
          <div>
            <Link 
              href="/booking_poc"
              className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Open Booking Calendar
            </Link>
          </div>
          <div>
            <Link 
              href="/booking_poc/time-slots"
              className="inline-block rounded-lg bg-green-500 px-6 py-3 text-white font-semibold hover:bg-green-600 transition-colors"
            >
              Time Slot Selection
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

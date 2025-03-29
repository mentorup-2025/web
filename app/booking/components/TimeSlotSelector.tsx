  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Select Your Available Time Slots</h2>
      
      <div className="space-y-4">
        {timeSlots.map((slot, index) => (
          <div key={slot.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-900 font-medium w-8">{index + 1}.</span>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
              className="border rounded-md px-3 py-2 flex-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
            <select
              value={slot.startTime}
              onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
              className="border rounded-md px-3 py-2 w-48 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value} className="text-gray-900">
                  {time.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeTimeSlot(slot.id)}
              className="text-red-600 hover:text-red-700 px-2 hover:bg-red-50 rounded-full h-8 w-8 flex items-center justify-center"
              aria-label="Remove time slot"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <button
          onClick={addTimeSlot}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors w-full font-medium"
        >
          + Add Time Slot
        </button>

        {timeSlots.length > 0 && (
          <button
            onClick={() => console.log('Selected time slots:', timeSlots)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full font-medium"
          >
            Save Time Slots
          </button>
        )}
      </div>
    </div>
  );
} 
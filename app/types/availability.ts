export interface Availability {
    day_of_week: number;    // 0-6 representing Sunday to Saturday
    start_time: string;     // Format: "HH:mm", e.g., "09:00"
    end_time: string;       // Format: "HH:mm", e.g., "17:00"
}

export interface SetAvailabilityInput {
    user_id: string;
    availabilities: Availability[];
}

export interface ViewAvailabilityInput {
  user_id: string;
  start_date: Date;
  end_date: Date;
}

// Validation helper
export function isValidAvailability(availability: Availability): boolean {
    return (
        // Validate day of week (0-6)
        availability.day_of_week >= 0 &&
        availability.day_of_week <= 6 &&
        // Validate time format (24-hour)
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(availability.start_time) &&
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(availability.end_time) &&
        // Ensure start time is before end time
        availability.start_time < availability.end_time
    );
} 
import { getSupabaseClient } from '../services/supabase';
import { BlockAvailabilityInput, isValidAvailability, SetAvailabilityInput } from '@/app/types';

export async function setRegularAvailability(input: SetAvailabilityInput): Promise<void> {
    try {
       
        // Validate all availabilities first
        const invalidSlots = input.availabilities.filter(slot => !isValidAvailability(slot));
        if (invalidSlots.length > 0) {
            throw new Error('Invalid availability slots provided');
        }

        // Call the set_weekly_availability RPC function
        const { data, error } = await getSupabaseClient()
            .rpc('set_weekly_availability', {
                p_mentor_id: input.user_id,
                availability: input.availabilities.map(slot => ({
                    day_of_week: slot.day_of_week,
                    start_time: slot.start_time,
                    end_time: slot.end_time
                }))
            });

        if (error) {
            console.error('Error setting availability:', error);
            throw error;
        }

        return data;

    } catch (error) {
        console.error('Error in setRegularAvailability:', error);
        throw error;
    }
}

export async function getMentorAvailability(input: { 
    mentor_id: string, 
    start_date: Date, 
    end_date: Date 
}): Promise<any[]> {
    try {
        const { data, error } = await getSupabaseClient()
            .rpc('get_mentor_availability', {
                p_mentor_id: input.mentor_id,
                start_date: input.start_date,
                end_date: input.end_date
            });

        if (error) {
            console.error('Error getting mentor availability:', error);
            throw error;
        }

        return data || [];

    } catch (error) {
        console.error('Error in getMentorAvailability:', error);
        throw error;
    }
}

export async function blockAvailability(input: BlockAvailabilityInput): Promise<void> {
    try {
        // For single day blocks or date ranges, we want to block the entire day(s)
        const startDateTime = `${input.start_date}T00:00:00Z`;  // Start of day in UTC
        const endDateTime = `${input.end_date}T23:59:59.999Z`;  // End of day in UTC

        // Insert block into mentor_blocks table
        const { error } = await getSupabaseClient()
            .from('mentor_blocks')
            .insert({
                mentor_id: input.mentor_id,
                // Use timestamptz range for the entire day(s)
                blocked_range: `[${startDateTime},${endDateTime}]`,
            });

        if (error) {
            console.error('Error blocking availability:', error);
            throw error;
        }

    } catch (error) {
        console.error('Error in blockAvailability:', error);
        throw error;
    }
}


export async function getMentorDailyAvailability(mentor_id: string, date: Date): Promise<any[]> {
    try {
        const { data, error } = await getSupabaseClient()
            .rpc('get_mentor_daily_availability', {
                p_mentor_id: mentor_id,
                query_date: date
            });

        if (error) {
            console.error('Error getting mentor daily availability:', error);
            throw error;
        }

        // RPC returns array of available time slots
        return data || [];

    } catch (error) {
        console.error('Error in getMentorDailyAvailability:', error);
        throw error;
    }
} 


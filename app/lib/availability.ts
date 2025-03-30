import { getSupabaseClient } from '../services/supabase';
import { SetAvailabilityInput, Availability, isValidAvailability } from '../types/availability';
import { getUser } from './user';

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


import { getSupabaseClient } from '../services/supabase';
import { ReserveAppointmentResponse, CreateAppointmentInput } from '@/app/types';


export async function createAppointment(input: CreateAppointmentInput): Promise<ReserveAppointmentResponse> {
    try {
        const { data, error } = await getSupabaseClient()
            .rpc('reserve_slot', {
                appointment_data: {
                    mentor_id: input.mentor_id,
                    mentee_id: input.mentee_id,
                    start_time: input.start_time,
                    end_time: input.end_time,
                    service_type: input.service_type,
                    price: input.price
                }
            });

        if (error) {
            console.error('Error creating appointment:', error);
            
            // Handle specific error cases from the RPC function
            if (error.message.includes('CONFLICT_EXISTING_APPOINTMENT')) {
                throw new Error('Time slot is already booked');
            }
            if (error.message.includes('CONFLICT_ACTIVE_HOLD')) {
                throw new Error('Time slot is currently on hold');
            }
            if (error.message.includes('INVALID_TIME_RANGE')) {
                throw new Error('Invalid time range provided');
            }
            
            throw error;
        }

        return data as ReserveAppointmentResponse;

    } catch (error) {
        console.error('Error in createAppointment:', error);
        throw error;
    }
}

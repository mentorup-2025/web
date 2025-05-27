import { Appointment, CreateAppointmentInput, ReserveAppointmentResponse } from '@/types';
import { getSupabaseClient } from '../services/supabase';
import { respOk } from './resp';


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

export async function confirmAppointment(
  appointmentId: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .rpc('confirm_booking', {
         appointment_id: appointmentId
      });

    if (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }

     return respOk;

  } catch (error) {
    console.error('Error in confirmBooking:', error);
    throw error;
  }
}

export async function cancelAppointmentPayment(
  appointmentId: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .rpc('cancel_booking', {
        appointment_id: appointmentId
      });

    if (error) {
      console.error('Error canceling booking:', error);
      throw error;
    }

    return respOk;

  } catch (error) {
    console.error('Error in cancelAppointmentPayment:', error);
    throw error;
  }
}

export async function updateAppointment(
  appointmentId: string,
  updates: {
    time_slot?: [string, string];  // [start_time, end_time]
    status?: 'confirmed' | 'completed' | 'canceled' | 'noshow';
  }
) {
  try {
    // Prepare update data
    const updateData: any = {};
    
    if (updates.time_slot) {
      updateData.time_slot = `[${updates.time_slot[0]},${updates.time_slot[1]})`;
    }
    
    if (updates.status) {
      updateData.status = updates.status;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform the update
    const { error: updateError } = await getSupabaseClient()
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      throw updateError;
    }

    return respOk;

  } catch (error) {
    console.error('Error in updateAppointment:', error);
    throw error;
  }
}

export async function getAppointment(appointmentId: string):Promise<Appointment | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id (*),
        mentee:mentee_id (*)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }

    return data;

  } catch (error) {
    console.error('Error in getAppointment:', error);
    throw error;
  }
}

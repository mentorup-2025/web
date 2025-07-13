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
          price: input.price,
          resume_url: input.resume_url || null // 加上resume的url
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

export async function confirmAppointmentPaid(
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
    // Delete the appointment row directly from the database
    const { error } = await getSupabaseClient()
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }

    console.log(`Appointment ${appointmentId} canceled and deleted from database`);

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
    status?: 'confirmed' | 'completed' | 'canceled' | 'noshow' | 'reschedule_in_progress' | 'paid';
    link?: string;  // Google Meet link
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

    if (updates.link) {
      updateData.link = updates.link;
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

export async function getAppointment(appointmentId: string): Promise<Appointment> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('appointments')
      .select(`
        *
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }

    if (!data) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    // Convert tstzrange time_slot to start_time and end_time
    const appointment: Appointment = {
      ...data,
      start_time: '',
      end_time: ''
    };

    // Parse the tstzrange format "[start,end)" or "[start,end]"
    if (data.time_slot) {
      const timeSlotStr = data.time_slot as string;
      console.log('📅 Raw time_slot from DB:', timeSlotStr);
      
      // Remove brackets and split by comma
      const cleanTimeSlot = timeSlotStr.replace(/[\[\]()]/g, '');
      const [startStr, endStr] = cleanTimeSlot.split(',');
      
      if (startStr && endStr) {
        appointment.start_time = startStr.trim();
        appointment.end_time = endStr.trim();
        console.log('📅 Parsed times:', { start: appointment.start_time, end: appointment.end_time });
      } else {
        console.error('❌ Failed to parse time_slot:', timeSlotStr);
      }
    }

    return appointment;

  } catch (error) {
    console.error('Error in getAppointment:', error);
    throw error;
  }
}

export async function getUserAppointment(userId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('appointments')
      .select(`
        *
      `)
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user appointments:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Convert tstzrange time_slot to start_time and end_time for each appointment
    const appointments: Appointment[] = data.map((appointment: any) => {
      const convertedAppointment: Appointment = {
        ...appointment,
        start_time: '',
        end_time: ''
      };

      // Parse the tstzrange format "[start,end)" or "[start,end]"
      if (appointment.time_slot) {
        const timeSlotStr = appointment.time_slot as string;
        
        // Remove brackets and split by comma
        const cleanTimeSlot = timeSlotStr.replace(/[\[\]()]/g, '');
        const [startStr, endStr] = cleanTimeSlot.split(',');
        
        if (startStr && endStr) {
          convertedAppointment.start_time = startStr.trim();
          convertedAppointment.end_time = endStr.trim();
        }
      }

      return convertedAppointment;
    });

    return appointments;

  } catch (error) {
    console.error('Error in getUserAppointment:', error);
    throw error;
  }
}

// this should set status to confirmed and remove any reschedule proposal
export async function confirmAppointment(
  appointmentId: string,
  startTime: string,
  endTime: string
) {
  const { error } = await getSupabaseClient()
    .rpc('confirm_appointment', {
      appointment_id: appointmentId,
      start_time: startTime,
      end_time: endTime
    });

  if (error) { throw error }

  return respOk;
}

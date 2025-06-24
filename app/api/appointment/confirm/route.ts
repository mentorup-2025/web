import { NextRequest } from 'next/server';
import { confirmAppointment } from '@/lib/appointment';
import { respData, respErr } from '@/lib/resp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { appointment_id, start_time, end_time } = body;
    
    if (!appointment_id) {
      return respErr('Missing required field: appointment_id');
    }

    if (!start_time || !end_time) {
      return respErr('Missing required fields: start_time and end_time');
    }

    await confirmAppointment(appointment_id, start_time, end_time);

    console.log(`Appointment ${appointment_id} confirmed successfully with new time slot: ${start_time} to ${end_time}`);

    return respData({ appointment_id, status: 'confirmed', start_time, end_time });

  } catch (error: any) {
    console.error('Error confirming appointment:', error);

    return respErr('Failed to confirm appointment: ' + error.message);
  }
} 
import { NextRequest } from 'next/server';
import { confirmAppointment } from '@/lib/appointment';
import { respData, respErr } from '@/lib/resp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { appointment_id } = body;
    
    if (!appointment_id) {
      return respErr('Missing required field: appointment_id');
    }

    await confirmAppointment(appointment_id);

    console.log(`Appointment ${appointment_id} confirmed successfully`);

    return respData({ appointment_id, status: 'confirmed' });

  } catch (error: any) {
    console.error('Error confirming appointment:', error);

    return respErr('Failed to confirm appointment: ' + error.message);
  }
} 
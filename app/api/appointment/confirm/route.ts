import { respData, respErr } from '@/lib/resp';
import { confirmAppointment } from '@/lib/appointment';
import { ConfirmAppointmentInput } from '@/types';

export async function POST(request: Request) {
    try {
        const input: ConfirmAppointmentInput = await request.json();

        // Validate required fields
        if (!input.appointment_id) {
            return respErr('Missing required fields');
        }

        // Confirm appointment
        await confirmAppointment( input.appointment_id);

        return respData({ message: 'Appointment confirmed successfully' });

    } catch (error) {
        console.error('Error confirming appointment:', error);

        if (error instanceof Error) {
            if (error.message.includes('CONFIRMATION_FAILED')) {
                return respErr('Failed to confirm appointment: Invalid appointment state');
            }
            return respErr(error.message);
        }

        return respErr('Failed to confirm appointment');
    }
}

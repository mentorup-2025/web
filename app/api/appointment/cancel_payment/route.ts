import { respData, respErr } from '@/lib/resp';
import { cancelAppointmentPayment } from '@/lib/appointment';
import { CancelAppointmentInput } from '@/types';

export async function POST(request: Request) {
    try {
        const input: CancelAppointmentInput = await request.json();

        // Validate required fields
        if (!input.appointment_id ) {
            return respErr('Missing required fields');
        }

        // Cancel appointment
        await cancelAppointmentPayment( input.appointment_id);

        return respData({ message: 'Appointment cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling appointment:', error);

        if (error instanceof Error) {
            if (error.message.includes('CANCELLATION_FAILED')) {
                return respErr('Failed to cancel appointment: Invalid appointment state');
            }
            return respErr(error.message);
        }

        return respErr('Failed to cancel appointment');
    }
}

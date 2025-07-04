import { respData, respErr } from '@/lib/resp';
import { ConfirmAppointmentPaidInput } from '@/types';
import { ConfirmAppointmentPaidHelper } from '@/lib/confirm_appointment_paid';

export async function POST(request: Request) {
    try {
        const input: ConfirmAppointmentPaidInput = await request.json();

        // Validate required fields
        if (!input.appointment_id) {
            return respErr('Missing appointment ID');
        }

        // Use the helper class to handle the confirmation process
        await ConfirmAppointmentPaidHelper.confirmAppointmentPaid(input.appointment_id);

        return respData({ 
            message: 'Appointment confirmed successfully'
        });

    } catch (error) {
        console.error('Error in appointment paid route:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('CONFIRMATION_FAILED')) {
                return respErr('Failed to confirm appointment: Invalid appointment state');
            }
            return respErr(error.message);
        }

        return respErr('Failed to confirm appointment');
    }
}

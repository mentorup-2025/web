 import { respData, respErr } from '@/lib/resp';
import { createAppointment } from '@/lib/appointment';
import { CreateAppointmentInput } from '@/types';
import { getUser } from '@/lib/user';
import { ConfirmAppointmentPaidHelper } from '@/lib/confirm_appointment_paid';
import { isFreeCoffeeChat } from '@/services/constants';

export async function POST(request: Request) {
    try {
        const input: CreateAppointmentInput = await request.json();

        // Validate required fields
        if (!input.mentor_id || !input.mentee_id || !input.start_time || 
            !input.end_time || !input.service_type || input.price === undefined) {
            return respErr('Missing required fields');
        }

        // Validate mentor and mentee exist in parallel
        const [mentor, mentee] = await Promise.all([
            getUser(input.mentor_id),
            getUser(input.mentee_id)
        ]);

        // Validate mentor
        if (!mentor?.mentor) {
            return respErr('Invalid mentor ID');
        }

        // Validate mentee
        if (!mentee) {
            return respErr('Invalid mentee ID');
        }

        // Create appointment
        const result = await createAppointment(input);

        // If service type is free coffee chat, confirm appointment as paid
        if (isFreeCoffeeChat(input.service_type)) {
            await ConfirmAppointmentPaidHelper.confirmAppointmentPaid(result.appointment_id);
        }

        return respData(result);

    } catch (error) {
        console.error('Error creating appointment:', error);

        if (error instanceof Error) {
            if (error.message === 'Time slot is already booked') {
                return respErr('This time slot is already booked');
            }
            if (error.message === 'Time slot is currently on hold') {
                return respErr('This time slot is temporarily reserved');
            }
            if (error.message === 'Invalid time range provided') {
                return respErr('Invalid appointment time range');
            }
            return respErr(error.message);
        }

        return respErr('Failed to create appointment');
    }
} 
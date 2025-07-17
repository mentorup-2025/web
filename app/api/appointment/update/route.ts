import { respData, respErr } from '@/lib/resp';
import { getAppointment, updateAppointment } from '@/lib/appointment';
import { UpdateAppointmentInput } from '@/types/appointment';

export async function POST(request: Request) {
    try {
        const input: UpdateAppointmentInput = await request.json();

        // Validate required fields
        if (!input.appointment_id) {
            return respErr('Missing appointment ID');
        }

        // Validate that at least one update field is provided
        if (!input.status && !input.link  && !input.extra_info && !input.description && !input.cancel_reason) {
            return respErr('No update fields provided');
        }

        // Validate status if provided
        if (input.status && !['confirmed', 'completed', 'canceled', 'noshow'].includes(input.status)) {
            return respErr('Invalid status value');
        }

        // Validate link if provided
        if (input.link && typeof input.link !== 'string') {
            return respErr('Link must be a string');
        }


        // Validate extra_info if provided
        if (input.extra_info && typeof input.extra_info !== 'string') {
            return respErr('Extra info must be a string');
        }

        // Validate description if provided
        if (input.description && typeof input.description !== 'string') {
            return respErr('Description must be a string');
        }

        // Validate cancel_reason if provided
        if (input.cancel_reason && typeof input.cancel_reason !== 'string') {
            return respErr('Cancel reason must be a string');
        }

        // Validate that if cancel_reason is provided, status must be canceled'
        if (input.cancel_reason && (!input.status || input.status !== 'canceled')) {
            return respErr('Cancel reason can only be provided when status is set to canceled');
        }

        // Check if appointment exists and is confirmed
        const appointment = await getAppointment(input.appointment_id);

        if (!appointment) {
            return respErr('Appointment not found');
        }

        if (appointment.status == 'pending') {
            return respErr('pending appointment cannot be updated');
        }

        // Update appointment
        await updateAppointment(input.appointment_id, {
            status: input.status,
            link: input.link,
            extra_info: input.extra_info,
            description: input.description,
            cancel_reason: input.cancel_reason
        });

        return respData({ message: 'Appointment updated successfully' });

    } catch (error) {
        console.error('Error updating appointment:', error);

        if (error instanceof Error) {
            if (error.message.includes('violates exclusion constraint')) {
                return respErr('Time slot conflicts with another appointment');
            }
            return respErr(error.message);
        }

        return respErr('Failed to update appointment');
    }
}
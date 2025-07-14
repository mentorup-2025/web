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
        if (!input.time_slot && !input.status && !input.link && !input.resume_url && !input.extra_info && !input.description) {
            return respErr('No update fields provided');
        }

        // Validate time_slot format if provided
        if (input.time_slot) {
            if (!Array.isArray(input.time_slot) || input.time_slot.length !== 2) {
                return respErr('Invalid time_slot format. Expected [start_time, end_time]');
            }
            if (!input.time_slot[0] || !input.time_slot[1]) {
                return respErr('Both start_time and end_time are required');
            }
        }

        // Validate status if provided
        if (input.status && !['confirmed', 'completed', 'canceled', 'noshow'].includes(input.status)) {
            return respErr('Invalid status value');
        }

        // Validate link if provided
        if (input.link && typeof input.link !== 'string') {
            return respErr('Link must be a string');
        }

        // Validate resume_url if provided
        if (input.resume_url && typeof input.resume_url !== 'string') {
            return respErr('Resume URL must be a string');
        }

        // Validate extra_info if provided
        if (input.extra_info && typeof input.extra_info !== 'string') {
            return respErr('Extra info must be a string');
        }

        // Validate description if provided
        if (input.description && typeof input.description !== 'string') {
            return respErr('Description must be a string');
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
            time_slot: input.time_slot,
            status: input.status,
            link: input.link,
            resume_url: input.resume_url,
            extra_info: input.extra_info,
            description: input.description
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
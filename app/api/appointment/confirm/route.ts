import { respData, respErr } from '@/lib/resp';
import { confirmAppointment, getAppointment } from '@/lib/appointment';
import { ConfirmAppointmentInput } from '@/types';
import { getUser } from '@/lib/user';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';

export async function POST(request: Request) {
    try {
        const input: ConfirmAppointmentInput = await request.json();

        // Validate required fields
        if (!input.appointment_id) {
            return respErr('Missing required fields');
        }

        // Confirm appointment
        await confirmAppointment( input.appointment_id);

       

        const appointment = await getAppointment(input.appointment_id);

      // Send confirmation email
      if (appointment) {
        const user = await getUser(appointment.mentee_id);
        const mentor = await getUser(appointment.mentor_id);
        if (user && mentor) {
          try {
            const emailResult = await sendEmail(
              'MentorUP <no-reply@mentorup.info>',
              user.email,
              EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION,
              {
                userName: user.username,
                serviceName: appointment.service_type,
                price: appointment.price,
                mentorName: mentor.username,
                appointmentStartTime: appointment.start_time,
                appointmentEndTime: appointment.end_time
              }
            );
            console.log(' Email sent:', emailResult);
          } catch (emailError) {
            console.error(' Email failed:', emailError);
          }
        }
        return respData({ message: 'Appointment confirmed successfully' });
      } else {
        console.log('ℹNo appointment found for ID:', input.appointment_id);
      }

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

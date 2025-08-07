import { confirmAppointmentPaid, getAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { Appointment, User } from '@/types';

export class ConfirmAppointmentPaidHelper {
  /**
   * Confirms a paid appointment and sends confirmation email
   * @param appointmentId - The ID of the appointment to confirm
   */
  static async confirmAppointmentPaid(appointmentId: string): Promise<void> {
    // Step 1: Get appointment details first
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Step 2: Confirm the appointment in the database
    await confirmAppointmentPaid(appointmentId);
    console.log('Appointment confirmed in database:', appointmentId);

    // Step 3: Get user details (mentee and mentor)
    const [mentee, mentor] = await Promise.all([
      getUser(appointment.mentee_id),
      getUser(appointment.mentor_id)
    ]);

    if (!mentee || !mentor) {
      console.error('❌ Failed to get user details:', { 
        mentee: !!mentee, 
        mentor: !!mentor,
        menteeId: appointment.mentee_id,
        mentorId: appointment.mentor_id
      });
      throw new Error('Failed to get user details');
    }

    // Step 5: Send confirmation emails to both mentee and mentor in parallel
    try {
      await Promise.all([
        // Send email to mentee
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          mentee.email,
          EmailTemplate.MENTEE_APPOINTMENT_REQUEST,
          {
            userName: mentee.username,
            serviceName: appointment.service_type,
            mentorName: mentor.username,
            appointmentStartTime: appointment.start_time,
            appointmentEndTime: appointment.end_time
          }
        ),
        // Send email to mentor
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          mentor.email,
          EmailTemplate.MENTOR_APPOINTMENT_REQUEST,
          {
            mentorName: mentor.username,
            serviceName: appointment.service_type,
            appointmentStartTime: appointment.start_time,
            appointmentEndTime: appointment.end_time,
            appointmentId: appointmentId
          }
        )
      ]);
      
      console.log('📧 Confirmation emails sent successfully to:', {
        mentee: mentee.email,
        mentor: mentor.email
      });
    } catch (emailError) {
      console.error('❌ Failed to send confirmation emails:', emailError);
      // Don't fail the entire process if email fails
    }
  }
} 
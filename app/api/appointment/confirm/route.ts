import { NextRequest } from 'next/server';
import { confirmAppointment, getAppointment, updateAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { respData, respErr } from '@/lib/resp';
import { generateMeetLink } from '@/lib/meet';

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

    // Confirm the appointment
    await confirmAppointment(appointment_id, start_time, end_time);

    console.log(`Appointment ${appointment_id} confirmed successfully with new time slot: ${start_time} to ${end_time}`);

    // Get appointment details for email
    const appointment = await getAppointment(appointment_id);
    if (!appointment) {
      console.error('Failed to get appointment details for email');
      return respData({ appointment_id, status: 'confirmed', start_time, end_time });
    }

    // Get user details (mentee and mentor)
    const [mentee, mentor] = await Promise.all([
      getUser(appointment.mentee_id),
      getUser(appointment.mentor_id)
    ]);

    if (!mentee || !mentor) {
      console.error('Failed to get user details for email:', { 
        mentee: !!mentee, 
        mentor: !!mentor 
      });
      return respData({ appointment_id, status: 'confirmed', start_time, end_time });
    }

    // Generate Meet link and update appointment
    let meetLink = '';
    try {
      const meet = await generateMeetLink({
        start_time,
        end_time,
        mentor_email: mentor.email,
        mentee_email: mentee.email
      });
      meetLink = meet.meeting_link;
      if (!meetLink) {
        throw new Error('Google Meet link was not generated.');
      }
      await updateAppointment(appointment_id, { link: meetLink });
    } catch (meetErr) {
      throw new Error('Google Meet link was not generated.');
    }

    // Send confirmation emails to both mentee and mentor in parallel
    try {
      await Promise.all([
        // Send email to mentee
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          mentee.email,
          EmailTemplate.APPOINTMENT_CONFIRMATION,
          {
            recipientName: mentee.username,
            mentorName: mentor.username,
            menteeName: mentee.username,
            serviceName: appointment.service_type,
            appointmentStartTime: appointment.start_time,
            appointmentEndTime: appointment.end_time,
            meetLink
          }
        ),
        // Send email to mentor
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          mentor.email,
          EmailTemplate.APPOINTMENT_CONFIRMATION,
          {
            recipientName: mentor.username,
            mentorName: mentor.username,
            menteeName: mentee.username,
            serviceName: appointment.service_type,
            appointmentStartTime: appointment.start_time,
            appointmentEndTime: appointment.end_time,
            meetLink
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

    return respData({ appointment_id, status: 'confirmed', start_time, end_time, meetLink });

  } catch (error: any) {
    console.error('Error confirming appointment:', error);

    return respErr('Failed to confirm appointment: ' + error.message);
  }
} 
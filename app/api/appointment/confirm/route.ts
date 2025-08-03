import { NextRequest } from 'next/server';
import { confirmAppointment, getAppointment, updateAppointment } from '@/lib/appointment';
import { getRescheduleProposal } from '@/lib/reschedule_proposal';
import { getUser } from '@/lib/user';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { respData, respErr } from '@/lib/resp';
import { generateMeetLink } from '@/lib/meet';
import { Appointment, RescheduleProposal } from '@/types';

function validateTime(appointment: Appointment, rescheduleProposal: RescheduleProposal | null, startTime: string, endTime: string): { isValid: boolean; source: string; error?: string } {
  try {
    // Validate input parameters
    if (!appointment || !appointment.start_time || !appointment.end_time) {
      return { isValid: false, source: '', error: 'Invalid appointment data' };
    }

    if (!startTime || !endTime) {
      return { isValid: false, source: '', error: 'Invalid time parameters' };
    }

    // Convert all times to Date objects for comparison
    const parseTime = (timeStr: string): Date => {
      // Remove quotes if present (from database)
      const cleanTime = timeStr.replace(/"/g, '');
      return new Date(cleanTime);
    };

    const providedStartDate = parseTime(startTime);
    const providedEndDate = parseTime(endTime);
    const appointmentStartDate = parseTime(appointment.start_time);
    const appointmentEndDate = parseTime(appointment.end_time);

    console.log('🔍 Time comparison:', {
      provided: { start: providedStartDate.toISOString(), end: providedEndDate.toISOString() },
      original: { start: appointmentStartDate.toISOString(), end: appointmentEndDate.toISOString() }
    });

    // Check if times match the original appointment times
    if (appointmentStartDate.getTime() === providedStartDate.getTime() && 
        appointmentEndDate.getTime() === providedEndDate.getTime()) {
      return { isValid: true, source: 'original appointment' };
    }

    // Check if times match any proposed reschedule times
    if (rescheduleProposal && rescheduleProposal.proposed_time && Array.isArray(rescheduleProposal.proposed_time)) {
      for (const [proposedStart, proposedEnd] of rescheduleProposal.proposed_time) {
        const proposedStartDate = parseTime(proposedStart);
        const proposedEndDate = parseTime(proposedEnd);
        
        if (proposedStartDate.getTime() === providedStartDate.getTime() && 
            proposedEndDate.getTime() === providedEndDate.getTime()) {
          return { isValid: true, source: 'reschedule proposal' };
        }
      }
    }

    // If we get here, times don't match anything
    console.error('Time validation failed:', {
      provided: { startTime: providedStartDate.toISOString(), endTime: providedEndDate.toISOString() },
      original: { start: appointmentStartDate.toISOString(), end: appointmentEndDate.toISOString() },
      proposed: rescheduleProposal?.proposed_time || 'none'
    });

    return { 
      isValid: false, 
      source: '', 
      error: 'Provided times do not match original appointment or any proposed reschedule times' 
    };

  } catch (error: any) {
    console.error('Error in validateTime:', error);
    return { isValid: false, source: '', error: 'Validation error: ' + error.message };
  }
}

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

    // Get the existing appointment to validate times
    const appointment = await getAppointment(appointment_id);
    if (!appointment) {
      return respErr('Appointment not found');
    }

    // Get any reschedule proposal for this appointment
    const rescheduleProposal = await getRescheduleProposal(appointment_id);

    // Validate the provided times
    const validation = validateTime(appointment, rescheduleProposal, start_time, end_time);
    
    if (!validation.isValid) {
      return respErr(validation.error || 'Time validation failed');
    }

    console.log(`✅ Time validation passed. Source: ${validation.source}`);

    // Confirm the appointment
    await confirmAppointment(appointment_id, start_time, end_time);

    console.log(`Appointment ${appointment_id} confirmed successfully with time slot: ${start_time} to ${end_time}`);

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
      console.error('Failed to generate Meet link:', meetErr);
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
            appointmentStartTime: start_time, // Use confirmed times, not original
            appointmentEndTime: end_time,     // Use confirmed times, not original
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
            appointmentStartTime: start_time, // Use confirmed times, not original
            appointmentEndTime: end_time,     // Use confirmed times, not original
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
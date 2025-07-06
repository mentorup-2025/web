import { NextRequest } from 'next/server';
import { createRescheduleProposal, deleteRescheduleProposal, getRescheduleProposal } from '@/lib/reschedule_proposal';
import { getAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { convertUTCToPDT } from '@/lib/utc_to_pdt';
import { CreateRescheduleProposalInput } from '@/types';
import { respData, respErr } from '@/lib/resp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { appointment_id, proposed_time_ranges, receiver, proposer } = body;
    
    if (!appointment_id || !proposed_time_ranges || !receiver || !proposer) {
      return respErr('Missing required fields: appointment_id, proposed_time_ranges, receiver, proposer');
    }

    // Validate proposed_time_ranges is an array
    if (!Array.isArray(proposed_time_ranges)) {
      return respErr('proposed_time_ranges must be an array');
    }

    // Validate each time range
    for (let i = 0; i < proposed_time_ranges.length; i++) {
      const range = proposed_time_ranges[i];
      
      if (!Array.isArray(range) || range.length !== 2) {
        return respErr(`Time range at index ${i} must be an array with exactly 2 elements [start_time, end_time]`);
      }

      const [startTime, endTime] = range;
      
      // Validate time format (ISO strings)
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return respErr(`Invalid time format at index ${i}. Please provide ISO string format for start_time and end_time`);
      }

      // Validate that end time is after start time
      if (endDate <= startDate) {
        return respErr(`End time must be after start time at index ${i}`);
      }
    }

    const input: CreateRescheduleProposalInput = {
      appointment_id,
      proposed_time_ranges,
      receiver,
      proposer
    };

    const proposal = await createRescheduleProposal(input);

    console.log(`Reschedule proposal created for appointment ${appointment_id}`);

    // Send emails to both proposer and receiver
    try {
      // Get appointment details
      const appointment = await getAppointment(appointment_id);
      if (!appointment) {
        console.error('Appointment not found for email sending:', appointment_id);
        return respData(proposal); // Return success even if email fails
      }

      // Get user details
      const [proposerUser, receiverUser] = await Promise.all([
        getUser(proposer),
        getUser(receiver)
      ]);

      if (!proposerUser || !receiverUser) {
        console.error('Failed to get user details for email sending:', { proposer, receiver });
        return respData(proposal); // Return success even if email fails
      }

      // Convert UTC times to PDT
      const pdtOriginalStartTime = convertUTCToPDT(appointment.start_time);
      const pdtOriginalEndTime = convertUTCToPDT(appointment.end_time);
      
      // Convert proposed time ranges to PDT
      const pdtProposedTimeRanges = proposed_time_ranges.map((range: [string, string]) => [
        convertUTCToPDT(range[0]),
        convertUTCToPDT(range[1])
      ]);

      // Send emails in parallel
      await Promise.all([
        // Send email to proposer (confirmation that proposal was sent)
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          proposerUser.email,
          EmailTemplate.RESCHEDULE_PROPOSAL_SENT,
          {
            proposerName: proposerUser.username,
            receiverName: receiverUser.username,
            appointmentId: appointment_id,
            originalStartTime: pdtOriginalStartTime,
            originalEndTime: pdtOriginalEndTime,
            proposedTimeRanges: pdtProposedTimeRanges
          }
        ),
        // Send email to receiver (notification about reschedule request)
        sendEmail(
          'MentorUP <contactus@mentorup.info>',
          receiverUser.email,
          EmailTemplate.RESCHEDULE_PROPOSAL_RECEIVED,
          {
            receiverName: receiverUser.username,
            proposerName: proposerUser.username,
            appointmentId: appointment_id,
            originalStartTime: pdtOriginalStartTime,
            originalEndTime: pdtOriginalEndTime,
            proposedTimeRanges: pdtProposedTimeRanges
          }
        )
      ]);

      console.log('📧 Reschedule proposal emails sent successfully to:', {
        proposer: proposerUser.email,
        receiver: receiverUser.email
      });

    } catch (emailError) {
      console.error('❌ Failed to send reschedule proposal emails:', emailError);
      // Don't fail the entire process if email fails
    }

    return respData(proposal);

  } catch (error: any) {
    console.error(' Error creating reschedule proposal:', error);

    return respErr('Failed to create reschedule proposal' + error.message);
  }
} 
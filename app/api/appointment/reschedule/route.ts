import { NextRequest } from 'next/server';
import { createRescheduleProposal, deleteRescheduleProposal, getRescheduleProposal } from '@/lib/reschedule_proposal';
import { updateAppointment } from '@/lib/appointment';
import { CreateRescheduleProposalInput } from '@/types';
import { respData, respErr } from '@/lib/resp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { appointment_id, proposed_start_time, proposed_end_time, receiver, proposer } = body;
    
    if (!appointment_id || !proposed_start_time || !proposed_end_time || !receiver || !proposer) {
      return respErr('Missing required fields: appointment_id, proposed_start_time, proposed_end_time, receiver, proposer');
    }

    // Validate time format (ISO strings)
    const startTime = new Date(proposed_start_time);
    const endTime = new Date(proposed_end_time);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return respErr('Invalid time format. Please provide ISO string format for proposed_start_time and proposed_end_time');
    }

    // Validate that end time is after start time
    if (endTime <= startTime) {
      return respErr('End time must be after start time');
    }

    const input: CreateRescheduleProposalInput = {
      appointment_id,
      proposed_start_time,
      proposed_end_time,
      receiver,
      proposer
    };

    const proposal = await createRescheduleProposal(input);


    console.log(`Reschedule proposal created for appointment ${appointment_id}`);

    return respData(proposal);

  } catch (error: any) {
    console.error(' Error creating reschedule proposal:', error);

    return respErr('Failed to create reschedule proposal' + error.message);
  }
} 
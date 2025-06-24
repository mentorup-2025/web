import { NextRequest } from 'next/server';
import { createRescheduleProposal, deleteRescheduleProposal, getRescheduleProposal } from '@/lib/reschedule_proposal';
import { updateAppointment } from '@/lib/appointment';
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

    return respData(proposal);

  } catch (error: any) {
    console.error(' Error creating reschedule proposal:', error);

    return respErr('Failed to create reschedule proposal' + error.message);
  }
} 
import { CreateRescheduleProposalInput, DeleteRescheduleProposalInput, RescheduleProposal } from '@/types';
import { getSupabaseClient } from '../services/supabase';
import { respOk } from './resp';

export async function createRescheduleProposal(input: CreateRescheduleProposalInput): Promise<RescheduleProposal> {
  try {
    // Extract start and end times from the pairs
    const proposed_start_times = input.proposed_time_ranges.map(range => range[0]);
    const proposed_end_times = input.proposed_time_ranges.map(range => range[1]);

    const { data, error } = await getSupabaseClient()
      .rpc('reschedule', {
        appointment_id: input.appointment_id,
        proposed_start_times: proposed_start_times,
        proposed_end_times: proposed_end_times,
        receiver: input.receiver,
        proposer: input.proposer,
        reason: input.reason,
      });

    if (error) {
      throw error;
    }

    // Transform the data to match our interface
    const proposal: RescheduleProposal = {
      id: data.id,
      proposed_time: data.proposed_time,
      receiver: data.receiver,
      proposer: data.proposer,
      proposed_at: data.proposed_at
    };

    return proposal;

  } catch (error) {
    console.error('Error in createRescheduleProposal:', error);
    throw error;
  }
}

export async function deleteRescheduleProposal(input: DeleteRescheduleProposalInput) {
  try {
    const { error } = await getSupabaseClient()
      .from('reschedule_proposals')
      .delete()
      .eq('id', input.appointment_id);

    if (error) {
      console.error('Error deleting reschedule proposal:', error);
      throw error;
    }

    return respOk;

  } catch (error) {
    console.error('Error in deleteRescheduleProposal:', error);
    throw error;
  }
}

export async function getRescheduleProposal(appointmentId: string): Promise<RescheduleProposal | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('reschedule_proposals')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching reschedule proposal:', error);
      throw error;
    }

    // Transform the tstzrange array back to our interface format
    const proposal: RescheduleProposal = {
      id: data.id,
      proposed_time: data.proposed_time.map((range: any) => [range.lower, range.upper]),
      receiver: data.receiver,
      proposer: data.proposer,
      proposed_at: data.proposed_at
    };

    return proposal;

  } catch (error) {
    console.error('Error in getRescheduleProposal:', error);
    throw error;
  }
}

export async function listRescheduleProposalsByReceiver(receiverId: string): Promise<RescheduleProposal[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('reschedule_proposals')
      .select('*')
      .eq('receiver', receiverId)
      .order('proposed_at', { ascending: false });

    if (error) {
      console.error('Error fetching reschedule proposals by receiver:', error);
      throw error;
    }

    console.log('Raw data from database:', JSON.stringify(data, null, 2));

    // Transform the data to match our interface
    const proposals: RescheduleProposal[] = (data || []).map(item => {
      console.log('Processing item:', item.id, 'proposed_time:', item.proposed_time);
      
      // Handle the proposed_time array properly
      let proposedTime: [string, string][];
      
        console.log('proposed_time is array with length:', item.proposed_time.length);
        
        proposedTime = item.proposed_time.map((range: any, index: number) => {
          console.log(`Range ${index}:`, range, 'type:', typeof range);
          
          if (typeof range === 'string') {
            // Parse PostgreSQL range format: ["start","end")
            const match = range.match(/\["([^"]+)","([^"]+)"\)/);
            if (match) {
              const startTime = match[1];
              const endTime = match[2];
              console.log(`Range ${index} parsed:`, startTime, endTime);
              return [startTime, endTime];
            } else {
              console.warn(`Could not parse range string at index ${index}:`, range);
              return ['', ''];
            }
          }  else {
            console.warn(`Unexpected time range format at index ${index}:`, range);
            return ['', '']; // Fallback
          }
        });
      

      const result = {
        id: item.id,
        proposed_time: proposedTime,
        receiver: item.receiver,
        proposer: item.proposer,
        proposed_at: item.proposed_at
      };
      
      console.log('Transformed result:', result);
      return result;
    });


    return proposals;

  } catch (error) {
    console.error('Error in listRescheduleProposalsByReceiver:', error);
    throw error;
  }
}

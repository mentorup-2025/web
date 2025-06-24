import { CreateRescheduleProposalInput, DeleteRescheduleProposalInput, RescheduleProposal } from '@/types';
import { getSupabaseClient } from '../services/supabase';
import { respOk } from './resp';

export async function createRescheduleProposal(input: CreateRescheduleProposalInput): Promise<RescheduleProposal> {
  try {
    const { data, error } = await getSupabaseClient()
      .rpc('reschedule', {
        appointment_id: input.appointment_id,
        proposed_start_time: input.proposed_start_time,
        proposed_end_time: input.proposed_end_time,
        receiver: input.receiver,
        proposer: input.proposer
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

    // Transform the tstzrange back to our interface format
    const proposal: RescheduleProposal = {
      id: data.id,
      proposed_time: [data.proposed_time.lower, data.proposed_time.upper],
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

    // Transform the data to match our interface
    const proposals: RescheduleProposal[] = (data || []).map(item => ({
      id: item.id,
      proposed_time: [item.proposed_time.lower, item.proposed_time.upper],
      receiver: item.receiver,
      proposer: item.proposer,
      proposed_at: item.proposed_at
    }));

    return proposals;

  } catch (error) {
    console.error('Error in listRescheduleProposalsByReceiver:', error);
    throw error;
  }
}

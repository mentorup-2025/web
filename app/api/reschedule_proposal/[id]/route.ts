import { NextRequest } from 'next/server';
import { listRescheduleProposalsByReceiver } from '@/lib/reschedule_proposal';
import { respData, respErr } from '@/lib/resp';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user_id = params.id;
    
    // Validate required parameter
    if (!user_id) {
      return respErr('Missing required parameter: user_id');
    }

    const proposals = await listRescheduleProposalsByReceiver(user_id);

    console.log(`Retrieved ${proposals.length} reschedule proposals for user ${user_id}`);

    return respData(proposals);

  } catch (error: any) {
    console.error('Error retrieving reschedule proposals:', error);

    return respErr('Failed to retrieve reschedule proposals: ' + error.message);
  }
} 
import { NextRequest } from 'next/server';
import { listRescheduleProposalsByReceiver } from '@/lib/reschedule_proposal';
import { respData, respErr } from '@/lib/resp';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // // Get user from Clerk session
    // const { userId } = await auth();
    
    // if (!userId) {
    //   return respErr('Unauthorized: User not authenticated');
    // }

    // // Validate that the authenticated user ID matches the user ID in the URL parameter
    // if (userId !== params.id) {
    //   return respErr('Unauthorized: User ID from session does not match user ID in URL');
    // }

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
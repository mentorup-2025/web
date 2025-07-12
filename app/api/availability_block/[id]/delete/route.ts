import { respData, respErr } from '@/lib/resp';
import { deleteMentorBlock } from '@/lib/availability';
import { DeleteAvailabilityInput } from '@/types';
import { auth } from '@clerk/nextjs/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get user from Clerk session
        const { userId } = await auth();
        
        if (!userId) {
            return respErr('Unauthorized: User not authenticated');
        }

        // Validate that the authenticated user ID matches the user ID in the URL parameter
        if (userId !== params.id) {
            return respErr('Unauthorized: User ID from session does not match user ID in URL');
        }

        const body = await request.json();
        const input: DeleteAvailabilityInput = {
            block_id: body.block_id
        };

        // Validate required fields
        if (!input.block_id) {
            return respErr('Missing required field: block_id');
        }

        // Delete the block
        await deleteMentorBlock(params.id, input.block_id);

        console.log(`Availability block deleted for user ${userId}`);

        return respData('Block deleted successfully');

    } catch (error) {
        console.error('Error in delete block:', error);
        return respErr('Failed to delete block');
    }
}

import { respData, respErr } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';
import { deleteMentorBlock } from '@/app/lib/availability';
import { DeleteAvailabilityInput } from '@/app/types';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
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

        return respData('Block deleted successfully');

    } catch (error) {
        console.error('Error in delete block:', error);
        return respErr('Failed to delete block');
    }
}

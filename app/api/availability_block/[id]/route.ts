import { respData, respErr } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';
import { getMentorBlocks } from '@/app/lib/availability';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Check if user is a mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Get blocks for the mentor
        const blocks = await getMentorBlocks(params.id);

        return respData(blocks);

    } catch (error) {
        console.error('Error in get mentor blocks:', error);
        return respErr('Failed to get mentor blocks');
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const block_id = url.searchParams.get('block_id');

        // Validate required parameters
        if (!block_id) {
            return respErr('Missing required parameter: block_id');
        }

        // Check if user is a mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Delete the specified block
        await deleteMentorBlock(params.id, block_id);

        return respData('Block deleted successfully');

    } catch (error) {
        console.error('Error in delete mentor block:', error);
        return respErr('Failed to delete mentor block');
    }
} 
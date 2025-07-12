import { respData, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';
import { blockAvailability } from '@/lib/availability';
import { BlockAvailabilityInput } from '@/types';
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
        const input: BlockAvailabilityInput = {
            mentor_id: params.id,
            start_date: body.start_date,
            end_date: body.end_date
        };

        // Check if user is a mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Block availability
        await blockAvailability(input);

        console.log(`Availability blocked for user ${userId}`);

        return respData('Availability blocked successfully');

    } catch (error) {
        console.error('Error in block availability:', error);
        return respErr('Failed to block availability');
    }
} 
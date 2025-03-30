import { respData, respErr } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';
import { blockAvailability } from '@/app/lib/availability';
import { BlockAvailabilityInput } from '@/app/types';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
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

        return respData('Availability blocked successfully');

    } catch (error) {
        console.error('Error in block availability:', error);
        return respErr('Failed to block availability');
    }
} 
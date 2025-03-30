import { respErr, respOk } from '@/app/lib/resp';
import { BlockAvailabilityInput } from '@/app/types/availability';
import { getUser } from '@/app/lib/user';
import { blockAvailability } from '@/app/lib/availability';

export async function POST(request: Request) {
    try {
        const input: BlockAvailabilityInput = await request.json();

        // Validate required parameters
        if (!input.mentor_id || !input.start_date || !input.end_date) {
            return respErr('Missing required parameters: mentor_id, start_date, end_date');
        }

        // Check if user is a mentor
        const user = await getUser(input.mentor_id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Parse dates
        const startDate = input.start_date;
        const endDate = input.end_date;

        await blockAvailability({
            mentor_id: input.mentor_id,
            start_date: startDate,
            end_date: endDate
        });

        return respOk();

    } catch (error) {
        console.error('Error blocking availability:', error);
        
        if (error instanceof Error && error.message === 'Start date must be before end date') {
            return respErr(error.message);
        }

        return respErr('Failed to block availability');
    }
} 
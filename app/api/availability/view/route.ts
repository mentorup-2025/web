import { respData, respErr } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';
import { getMentorAvailability } from '@/app/lib/availability';
import { ViewAvailabilityInput } from '@/app/types/availability';

export async function POST(request: Request) {
    try {
        const input: ViewAvailabilityInput = await request.json();

        // Validate required parameters
        if (!input.user_id || !input.start_date || !input.end_date) {
            return respErr('Missing required parameters: user_id, start_date, end_date');
        }

        // Check if user is a mentor
        const user = await getUser(input.user_id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Get availability using helper function
        const availability = await getMentorAvailability({
            mentor_id: input.user_id,
            start_date: new Date(input.start_date),
            end_date: new Date(input.end_date)
        });

        return respData(availability);

    } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid Date')) {
            return respErr('Invalid date format. Use YYYY-MM-DD');
        }
        console.error('Error in view availability:', error);
        return respErr('Failed to get availability');
    }
}

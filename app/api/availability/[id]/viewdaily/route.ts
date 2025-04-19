 import { respData, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';
import { getMentorDailyAvailability } from '@/lib/availability';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const date = url.searchParams.get('date');

        // Validate required parameters
        if (!date) {
            return respErr('Missing required parameter: date');
        }

        // Check if user is a mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Parse date
        const queryDate = new Date(date);
        if (isNaN(queryDate.getTime())) {
            return respErr('Invalid date format. Use YYYY-MM-DD');
        }

        // Get daily availability
        const availability = await getMentorDailyAvailability(
            params.id,
            queryDate
        );

        return respData(availability);

    } catch (error) {
        console.error('Error in view daily availability:', error);
        return respErr('Failed to get daily availability');
    }
} 
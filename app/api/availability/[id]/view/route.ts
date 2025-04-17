 import { respData, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';
import { getMentorAvailability } from '@/lib/availability';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const start_date = url.searchParams.get('start_date');
        const end_date = url.searchParams.get('end_date');

        // Validate required parameters
        if (!start_date || !end_date) {
            return respErr('Missing required parameters: start_date, end_date');
        }

        // Check if user is a mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // Get availability using helper function
        const availability = await getMentorAvailability({
            mentor_id: params.id,
            start_date: new Date(start_date),
            end_date: new Date(end_date)
        });

        console.log('Start date:', start_date);
        console.log('End date:', end_date);
        console.log('Supabase response:', { availability });

        return respData(availability);

    } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid Date')) {
            return respErr('Invalid date format. Use YYYY-MM-DD');
        }
        console.error('Error in view availability:', error);
        return respErr('Failed to get availability');
    }
} 
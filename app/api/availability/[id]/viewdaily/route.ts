import { respData, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';
import { getMentorDailyAvailabilityV2 } from '@/lib/availability';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const url = new URL(request.url);
        const date = url.searchParams.get('date');

        if (!date) {
            return respErr('Missing required parameter: date');
        }

        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        const queryDate = new Date(date);
        if (isNaN(queryDate.getTime())) {
            return respErr('Invalid date format. Use YYYY-MM-DD');
        }

        const availability = await getMentorDailyAvailabilityV2(
            params.id,
            queryDate
        );

        return respData(availability);

    } catch (error) {
        console.error('Error in view daily availability (v2):', error);
        return respErr('Failed to get daily availability');
    }
}
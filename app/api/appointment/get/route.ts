import { respData, respErr } from '@/lib/resp';
import { getUserAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';

export async function POST(request: Request) {
    try {
        const { user_id } = await request.json();

        // Validate required fields
        if (!user_id) {
            return respErr('Missing user_id');
        }

        // Check if user exists
        const user = await getUser(user_id);
        if (!user) {
            return respErr('User does not exist');
        }

        // Get user appointments
        const appointments = await getUserAppointment(user_id);

        return respData({ appointments });

    } catch (error) {
        console.error('Error getting user appointments:', error);

        if (error instanceof Error) {
            return respErr(error.message);
        }

        return respErr('Failed to get user appointments');
    }
} 
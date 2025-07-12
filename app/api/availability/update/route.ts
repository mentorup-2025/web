import { respErr, respJson, respOk } from '@/lib/resp';
import { setRegularAvailability } from '@/lib/availability';
import { SetAvailabilityInput } from '@/types/availability';
import { getUser } from '@/lib/user';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    try {
        // Get user from Clerk session
        const { userId } = await auth();
        
        if (!userId) {
            return respErr('Unauthorized: User not authenticated');
        }

        const input: SetAvailabilityInput = await request.json();

        // Validate input structure
        if (!input.user_id || !Array.isArray(input.availabilities)) {
            return respJson(400, 'Invalid input format');
        }

        // Validate that the authenticated user ID matches the user_id in the request
        if (userId !== input.user_id) {
            return respErr('Unauthorized: User ID from session does not match user_id in request');
        }

         // First check if user is a mentor
         const user = await getUser(input.user_id);
         if (!user?.mentor) {
             throw new Error('User is not a mentor');
         }
 

        await setRegularAvailability(input);
        
        console.log(`Availability updated for user ${userId}`);

        return respOk();

    } catch (error) {
        console.error('Error updating availability:', error);
        
        if (error instanceof Error && error.message === 'Invalid availability slots provided') {
            return respErr(error.message);
        }

        return respErr('Failed to update availability');
    }
} 
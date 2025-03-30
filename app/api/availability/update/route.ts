import { respErr, respJson, respOk } from '@/app/lib/resp';
import { setRegularAvailability } from '@/app/lib/availability';
import { SetAvailabilityInput } from '@/app/types/availability';
import { getUser } from '@/app/lib/user';

export async function POST(request: Request) {
    try {
        const input: SetAvailabilityInput = await request.json();

        // Validate input structure
        if (!input.user_id || !Array.isArray(input.availabilities)) {
            return respJson(400, 'Invalid input format');
        }

         // First check if user is a mentor
         const user = await getUser(input.user_id);
         if (!user?.mentor) {
             throw new Error('User is not a mentor');
         }
 

        await setRegularAvailability(input);
        
        return respOk();

    } catch (error) {
        console.error('Error updating availability:', error);
        
        if (error instanceof Error && error.message === 'Invalid availability slots provided') {
            return respErr(error.message);
        }

        return respErr('Failed to update availability');
    }
} 
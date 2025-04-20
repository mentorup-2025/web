import { respData, respErr } from '@/lib/resp';
import { updateUser } from '@/lib/user';
import { UpdateUserInput } from '@/types';

export async function POST(request: Request) {
    try {
        // Get update data from request
        const updateData = await request.json() as UpdateUserInput & { userId: string };

        // Validate required fields
        if (!updateData.userId) {
            return respErr('Missing required field: userId');
        }

        // Extract userId and create update input
        const { userId, ...updateInput } = updateData;

        // Validate update input
        if (Object.keys(updateInput).length === 0) {
            return respErr('No update data provided');
        }

        // Update user
        const updatedUser = await updateUser(userId, updateInput);

        return respData(updatedUser);

    } catch (error) {
        console.error('Error updating user:', error);
        
        if (error instanceof Error) {
            return respErr(error.message);
        }
        
        return respErr('Failed to update user');
    }
} 
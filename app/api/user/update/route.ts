import { respData, respErr } from '@/lib/resp';
import { updateUser } from '@/lib/user';
import { UpdateUserInput } from '@/types';

export async function POST(request: Request) {
    try {
        // Get update data from request
        const updateData = await request.json() as UpdateUserInput & { userId: string };
        console.log('Received update data:', updateData);

        // Validate required fields
        if (!updateData.userId) {
            return respErr('Missing required field: userId');
        }

        // Extract userId and create update input
        const { userId, ...updateInput } = updateData;
        console.log('Update input:', updateInput);

        // Validate update input
        if (Object.keys(updateInput).length === 0) {
            return respErr('No update data provided');
        }

        // Update user
        try {
            const updatedUser = await updateUser(userId, updateInput);
            console.log('User updated successfully:', updatedUser);
            return respData(updatedUser);
        } catch (updateError) {
            console.error('Error in updateUser function:', updateError);
            if (updateError instanceof Error) {
                return respErr(`Failed to update user: ${updateError.message}`);
            }
            return respErr('Failed to update user: Unknown error in updateUser function');
        }

    } catch (error) {
        console.error('Error in user update route:', error);
        
        if (error instanceof Error) {
            return respErr(`Failed to update user: ${error.message}`);
        }
        
        return respErr('Failed to update user: Unknown error');
    }
} 
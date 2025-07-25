import { clerkClient } from '@clerk/nextjs/server';

/**
 * Updates a user's profile image using the Clerk API
 * @param userId - The Clerk user ID
 * @param file - The file object to upload as profile image
 * @returns Promise<{ success: boolean; user?: any; error?: string }> - Returns success status and updated user data
 */
export async function updateProfileImage(userId: string, file: File): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Get the clerk client instance
    const clerk = await clerkClient();
    
    // Update the user's profile image using Clerk API
    const updatedUser = await clerk.users.updateUserProfileImage(userId, {
      file,
    });
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error updating profile image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
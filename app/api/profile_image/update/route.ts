import { NextRequest, NextResponse } from 'next/server';
import { updateProfileImage } from '@/lib/clerk';
import { respData, respOk, respErr } from '@/lib/resp';
import { updateUser } from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!userId) {
      return respErr('User ID is required');
    }

    if (!file) {
      return respErr('No image file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return respErr('File must be an image');
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return respErr('File size must be less than 5MB');
    }

    // Update the profile image using the helper method with the file directly
    const result = await updateProfileImage(userId, file);

    if (!result.success) {
      return respErr(result.error || 'Failed to update profile image');
    }

    // Extract the new image URL from Clerk's response
    // According to Clerk's response format, the image URL is in the image_url field
    const newImageUrl = result.user?.image_url;
    
    if (newImageUrl) {
      // Update the user's profile_url in our database using the UpdateUserInput type
      try {
        await updateUser(userId, {
          profile_url: newImageUrl
        });
        console.log('Successfully updated user profile_url in database:', newImageUrl);
      } catch (dbError) {
        console.error('Error updating user profile_url in database:', dbError);
        // Don't fail the request if database update fails, but log it
      }
    } else {
      console.warn('No image_url found in Clerk response:', result.user);
    }

    return respData({ 
      message: 'Profile image updated successfully',
      imageUrl: newImageUrl 
    });

  } catch (error) {
    console.error('Error updating profile image:', error);
    return respErr('Internal server error');
  }
} 
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { respOk, respErr } from '@/lib/resp';
import { deleteReview, getReviewById } from '@/lib/reviews';
import { DeleteReviewInput } from '@/types/reviews';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();
        if (!userId) {
            return respErr('Unauthorized');
        }

        // Parse request body
        const body: DeleteReviewInput = await request.json();
        const { reviewId } = body;

        // Validate input
        if (!reviewId) {
            return respErr('Missing required field: reviewId');
        }

        // First, retrieve the review to check if it exists and verify ownership
        const review = await getReviewById(reviewId);
        
        // If review doesn't exist, simply return success
        if (!review) {
            console.log(`ℹ️ Review ${reviewId} not found, nothing to delete`);
            return respOk();
        }

        // Check if the authenticated user is the reviewer
        if (review.reviewer !== userId) {
            console.log(`❌ User ${userId} attempted to delete review ${reviewId} owned by ${review.reviewer}`);
            return respErr('You can only delete your own reviews');
        }

        // Delete the review
        await deleteReview({
            reviewId
        });

        console.log('✅ Review deleted successfully:', {
            reviewId,
            reviewerId: userId
        });

        return respOk();

    } catch (error) {
        console.error('❌ Error deleting review:', error);
        
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('Failed to delete review')) {
                return respErr('Failed to delete review');
            }
        }
        
        return respErr('Failed to delete review');
    }
} 
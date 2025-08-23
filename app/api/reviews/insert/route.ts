import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { respOk, respErr } from '@/lib/resp';
import { createReview } from '@/lib/reviews';
import { CreateReviewInput } from '@/types/reviews';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();
        if (!userId) {
            return respErr('Unauthorized');
        }

        // Parse request body
        const body: CreateReviewInput = await request.json();
        const { reviewee, content, rating } = body;

        // Validate input
        if (!reviewee || !content) {
            return respErr('Missing required fields: reviewee and content');
        }

        if (content.trim().length === 0) {
            return respErr('Review content cannot be empty');
        }

        if (content.length > 1000) {
            return respErr('Review content too long (max 1000 characters)');
        }

        // Validate rating if provided
        if (rating !== undefined && rating !== null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
            return respErr('Rating must be an integer between 1 and 5');
        }

        // Prevent self-review
        if (reviewee === userId) {
            return respErr('Cannot review yourself');
        }

        // Create review
        const review = await createReview({
            reviewee,
            reviewer: userId,
            content: content.trim(),
            rating
        });

        console.log('✅ Review created successfully:', {
            reviewId: review.id,
            reviewee,
            reviewer: userId
        });

        return respOk();

    } catch (error) {
        console.error('❌ Error creating review:', error);
        return respErr('Failed to create review');
    }
} 
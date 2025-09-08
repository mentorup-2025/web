import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { respOk, respErr } from '@/lib/resp';
import { createReview } from '@/lib/reviews';
import { CreateReviewInput } from '@/types/reviews';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return respErr('Unauthorized');

        const body: CreateReviewInput = await request.json();
        const { reviewee, content, rating } = body;

        // 基本必填校验
        if (!reviewee || !content) {
            return respErr('Missing required fields: reviewee and content');
        }
        if (content.trim().length === 0) {
            return respErr('Review content cannot be empty');
        }
        if (content.length > 1000) {
            return respErr('Review content too long (max 1000 characters)');
        }
        if (reviewee === userId) {
            return respErr('Cannot review yourself');
        }

        // ⭐ rating 校验（1~5 的整数）
        if (rating === undefined || rating === null) {
            return respErr('Missing required field: rating');
        }
        const ratingNum = Number(rating);
        if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return respErr('Invalid rating: must be a number between 1 and 5');
        }
        const ratingInt = Math.round(ratingNum);

        // 创建
        const review = await createReview({
            reviewee,
            reviewer: userId,
            content: content.trim(),
            rating: ratingInt,
        });

        console.log('✅ Review created successfully:', {
            reviewId: review.id,
            reviewee,
            reviewer: userId,
            rating: ratingInt,
        });

        return respOk();
    } catch (error) {
        console.error('❌ Error creating review:', error);
        return respErr('Failed to create review');
    }
}
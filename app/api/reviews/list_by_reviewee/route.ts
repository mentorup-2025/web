import { NextRequest } from 'next/server';
import { respData, respErr } from '@/lib/resp';
import { listReviewsByReviewee } from '@/lib/reviews';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const revieweeId = searchParams.get('revieweeId');

        // Validate input
        if (!revieweeId) {
            return respErr('Missing required parameter: revieweeId');
        }

        // Get reviews
        const reviews = await listReviewsByReviewee(revieweeId);

        console.log('✅ Reviews fetched successfully:', {
            revieweeId,
            count: reviews.length
        });

        return respData(reviews);

    } catch (error) {
        console.error('❌ Error fetching reviews:', error);
        return respErr('Failed to fetch reviews');
    }
} 
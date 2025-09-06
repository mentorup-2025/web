import { getSupabaseClient } from '@/services/supabase';
import { Review, CreateReviewInput, DeleteReviewInput } from '@/types/reviews';

/**
 * Create a new review
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
        .from('reviews')
        .insert({
            reviewee: input.reviewee,
            reviewer: input.reviewer,
            content: input.content,
            rating: input.rating
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Error creating review:', error);
        throw new Error(`Failed to create review: ${error.message}`);
    }

    return data;
}

/**
 * List reviews by reviewee
 */
export async function listReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee', revieweeId)
        .order('creation_time', { ascending: false });

    if (error) {
        console.error('❌ Error fetching reviews:', error);
        throw new Error(`Failed to fetch reviews: ${error.message}`);
    }

    return data || [];
}

/**
 * Delete a review by ID
 */
export async function deleteReview(input: DeleteReviewInput): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', input.reviewId)
        .select();

    if (error) {
        console.error('❌ Error deleting review:', error);
        throw new Error(`Failed to delete review: ${error.message}`);
    }

    // If no rows were deleted (review doesn't exist), just return true
    // This prevents errors when trying to delete non-existent reviews
    if (!data || data.length === 0) {
        console.log(`ℹ️ Review ${input.reviewId} not found, nothing to delete`);
        return true;
    }

    return true;
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        console.error('❌ Error fetching review:', error);
        throw new Error(`Failed to fetch review: ${error.message}`);
    }

    return data;
} 
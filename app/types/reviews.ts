export interface Review {
    id: string;
    reviewee: string;
    reviewer: string;
    creation_time: string;
    content: string;
}

export interface CreateReviewInput {
    reviewee: string;
    reviewer: string;
    content: string;
}

export interface DeleteReviewInput {
    reviewId: string;
}

export interface ListReviewsByRevieweeInput {
    revieweeId: string;
} 
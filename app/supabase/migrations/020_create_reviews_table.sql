-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewee TEXT,
    reviewer TEXT ,
    creation_time TIMESTAMPTZ DEFAULT NOW(),
    content TEXT NOT NULL
);

-- Add index on reviewee for efficient querying
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee);

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Stores user reviews with reviewee and reviewer relationships';
COMMENT ON COLUMN reviews.id IS 'Unique identifier for the review';
COMMENT ON COLUMN reviews.reviewee IS 'User ID of the person being reviewed (references users.user_id)';
COMMENT ON COLUMN reviews.reviewer IS 'User ID of the person leaving the review (references users.user_id)';
COMMENT ON COLUMN reviews.creation_time IS 'Timestamp when the review was created';
COMMENT ON COLUMN reviews.content IS 'Text content of the review';
COMMENT ON INDEX idx_reviews_reviewee IS 'Index on reviewee for efficient querying of reviews by person being reviewed'; 
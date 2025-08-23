-- Add rating column to reviews table
ALTER TABLE reviews 
ADD COLUMN rating INTEGER;

-- Add check constraint to ensure rating is between 1 and 5
ALTER TABLE reviews 
ADD CONSTRAINT reviews_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Add comment to explain the column
COMMENT ON COLUMN reviews.rating IS 'Rating given by the reviewer (1-5 scale, optional)';

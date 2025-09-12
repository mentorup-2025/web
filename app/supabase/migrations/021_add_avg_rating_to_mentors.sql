-- Add avg_rating column to mentors table
ALTER TABLE mentors ADD COLUMN avg_rating DECIMAL(3,2);


-- Add comment for documentation
COMMENT ON COLUMN mentors.avg_rating IS 'Average rating for the mentor, calculated from reviews (0.00 to 5.00)';

-- First, add the introduction column to users table
ALTER TABLE users
ADD COLUMN introduction TEXT;

-- Remove the introduction column from mentors table
ALTER TABLE mentors
DROP COLUMN introduction; 
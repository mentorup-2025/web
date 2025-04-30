-- Add job_target column to users table
ALTER TABLE users
ADD COLUMN job_target jsonb; 
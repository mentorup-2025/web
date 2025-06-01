-- Add profileUrl column to users table
ALTER TABLE users
ADD COLUMN profile_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN users.profile_url IS 'URL to the user''s profile image stored in Supabase Storage';


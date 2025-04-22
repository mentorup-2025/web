-- Create enum type for user status
BEGIN;

-- Create the enum type
CREATE TYPE status AS ENUM (
    'Student',
    'New Graduate',
    'Employed',
    'Unemployed',
    'Career Switch',
    'Freelancer'
);

-- Add status column to users table without default value
ALTER TABLE users
ADD COLUMN status status;

COMMIT;

-- Rollback if needed
-- BEGIN;
--   ALTER TABLE users DROP COLUMN status;
--   DROP TYPE status;
-- COMMIT; 
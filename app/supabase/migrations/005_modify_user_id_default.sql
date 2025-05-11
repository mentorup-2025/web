-- First, drop all foreign key constraints
ALTER TABLE mentors 
    DROP CONSTRAINT IF EXISTS mentors_user_id_fkey;

ALTER TABLE mentor_overrides
    DROP CONSTRAINT IF EXISTS mentor_overrides_mentor_id_fkey;

ALTER TABLE mentor_blocks
    DROP CONSTRAINT IF EXISTS mentor_blocks_mentor_id_fkey;

ALTER TABLE appointments
    DROP CONSTRAINT IF EXISTS appointments_mentor_id_fkey;

ALTER TABLE appointments
    DROP CONSTRAINT IF EXISTS appointments_mentee_id_fkey;

ALTER TABLE temp_holds
    DROP CONSTRAINT IF EXISTS temp_holds_mentor_id_fkey;

ALTER TABLE temp_holds
    DROP CONSTRAINT IF EXISTS temp_holds_mentee_id_fkey;

ALTER TABLE mentor_availability
    DROP CONSTRAINT IF EXISTS mentor_availability_mentor_id_fkey;

-- Remove default UUID generation for user_id
ALTER TABLE users 
    ALTER COLUMN user_id DROP DEFAULT;

-- Change user_id type from UUID to text in both tables
ALTER TABLE users 
    ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE mentors
    ALTER COLUMN user_id TYPE text USING user_id::text;

-- Change mentor_id type to text in all related tables
ALTER TABLE mentor_overrides
    ALTER COLUMN mentor_id TYPE text USING mentor_id::text;

ALTER TABLE mentor_blocks
    ALTER COLUMN mentor_id TYPE text USING mentor_id::text;

ALTER TABLE appointments
    ALTER COLUMN mentor_id TYPE text USING mentor_id::text;

ALTER TABLE appointments
    ALTER COLUMN mentee_id TYPE text USING mentee_id::text;

ALTER TABLE temp_holds
    ALTER COLUMN mentor_id TYPE text USING mentor_id::text;

ALTER TABLE temp_holds
    ALTER COLUMN mentee_id TYPE text USING mentee_id::text;

ALTER TABLE mentor_availability
    ALTER COLUMN mentor_id TYPE text USING mentor_id::text;

-- Add comment to clarify that user_id must be provided by client
COMMENT ON COLUMN users.user_id IS 'Must be provided by client, no longer auto-generated';

-- Ensure user_id remains NOT NULL and PRIMARY KEY
ALTER TABLE users 
    ALTER COLUMN user_id SET NOT NULL;

-- Recreate the foreign key constraints
ALTER TABLE mentors
    ADD CONSTRAINT mentors_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(user_id);

ALTER TABLE mentor_overrides
    ADD CONSTRAINT mentor_overrides_mentor_id_fkey
    FOREIGN KEY (mentor_id)
    REFERENCES mentors(user_id);

ALTER TABLE mentor_blocks
    ADD CONSTRAINT mentor_blocks_mentor_id_fkey
    FOREIGN KEY (mentor_id)
    REFERENCES mentors(user_id);

ALTER TABLE appointments
    ADD CONSTRAINT appointments_mentor_id_fkey
    FOREIGN KEY (mentor_id)
    REFERENCES mentors(user_id);

ALTER TABLE appointments
    ADD CONSTRAINT appointments_mentee_id_fkey
    FOREIGN KEY (mentee_id)
    REFERENCES users(user_id);

ALTER TABLE temp_holds
    ADD CONSTRAINT temp_holds_mentor_id_fkey
    FOREIGN KEY (mentor_id)
    REFERENCES mentors(user_id);

ALTER TABLE temp_holds
    ADD CONSTRAINT temp_holds_mentee_id_fkey
    FOREIGN KEY (mentee_id)
    REFERENCES users(user_id);

ALTER TABLE mentor_availability
    ADD CONSTRAINT mentor_availability_mentor_id_fkey
    FOREIGN KEY (mentor_id)
    REFERENCES mentors(user_id);
-- Add meet link column to appointments table
ALTER TABLE appointments 
ADD COLUMN link TEXT;

-- Add comment to the column
COMMENT ON COLUMN appointments.link IS 'Google Meet link for the appointment';

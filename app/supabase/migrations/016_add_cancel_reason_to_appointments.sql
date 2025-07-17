-- Add cancel_reason column to appointments table
ALTER TABLE appointments 
ADD COLUMN cancel_reason TEXT;

-- Add comment to the column
COMMENT ON COLUMN appointments.cancel_reason IS 'Reason for appointment cancellation'; 
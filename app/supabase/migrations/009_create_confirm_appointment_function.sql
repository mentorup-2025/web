-- Create confirm_appointment function
CREATE OR REPLACE FUNCTION confirm_appointment(appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update appointment status to confirmed
    UPDATE appointments 
    SET status = 'confirmed', updated_at = timezone('utc'::text, now())
    WHERE id = appointment_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found with id: %', appointment_id;
    END IF;
    
    -- Delete the reschedule proposal if it exists
    DELETE FROM reschedule_proposals 
    WHERE id = appointment_id;
    
    -- Log the confirmation (optional)
    RAISE NOTICE 'Appointment % confirmed and reschedule proposal deleted', appointment_id;
    
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION confirm_appointment(uuid) IS 'Confirms an appointment by setting status to confirmed and deleting any reschedule proposal';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_appointment(uuid) TO authenticated; 
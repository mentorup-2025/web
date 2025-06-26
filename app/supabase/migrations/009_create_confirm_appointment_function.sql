-- Create confirm_appointment function
CREATE OR REPLACE FUNCTION confirm_appointment(
    appointment_id uuid,
    start_time timestamptz,
    end_time timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate input parameters
    IF start_time IS NULL OR end_time IS NULL THEN
        RAISE EXCEPTION 'Start time and end time cannot be null';
    END IF;
    
    IF start_time >= end_time THEN
        RAISE EXCEPTION 'Start time must be before end time';
    END IF;
    
    -- Update appointment status to confirmed and set the new time slot
    UPDATE appointments 
    SET 
        status = 'confirmed', 
        time_slot = tstzrange(start_time, end_time, '[)'),
        updated_at = timezone('utc'::text, now())
    WHERE id = appointment_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found with id: %', appointment_id;
    END IF;
    
    -- Delete the reschedule proposal if it exists
    DELETE FROM reschedule_proposals 
    WHERE id = appointment_id;
    
    -- Log the confirmation (optional)
    RAISE NOTICE 'Appointment % confirmed with new time slot % to % and reschedule proposal deleted', 
        appointment_id, start_time, end_time;
    
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION confirm_appointment(uuid, timestamptz, timestamptz) IS 'Confirms an appointment by setting status to confirmed, updating time_slot with new start/end times, and deleting any reschedule proposal';


-- Create reschedule function
CREATE OR REPLACE FUNCTION reschedule(
    appointment_id uuid,
    proposed_start_time timestamptz,
    proposed_end_time timestamptz,
    receiver text,
    proposer text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_proposal reschedule_proposals%ROWTYPE;
    new_proposal reschedule_proposals%ROWTYPE;
    result json;
BEGIN
    -- Validate input parameters
    IF appointment_id IS NULL THEN
        RAISE EXCEPTION 'appointment_id cannot be null';
    END IF;
    
    IF proposed_start_time IS NULL OR proposed_end_time IS NULL THEN
        RAISE EXCEPTION 'proposed_start_time and proposed_end_time cannot be null';
    END IF;
    
    IF receiver IS NULL OR proposer IS NULL THEN
        RAISE EXCEPTION 'receiver and proposer cannot be null';
    END IF;
    
    -- Validate time range
    IF proposed_end_time <= proposed_start_time THEN
        RAISE EXCEPTION 'proposed_end_time must be after proposed_start_time';
    END IF;
    
    -- Check if appointment exists
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id) THEN
        RAISE EXCEPTION 'Appointment not found with id: %', appointment_id;
    END IF;
    
    -- Check if existing reschedule proposal exists
    SELECT * INTO existing_proposal 
    FROM reschedule_proposals 
    WHERE id = appointment_id;
    
    -- Delete existing proposal if it exists
    IF existing_proposal IS NOT NULL THEN
        DELETE FROM reschedule_proposals WHERE id = appointment_id;
        RAISE NOTICE 'Deleted existing reschedule proposal for appointment %', appointment_id;
    END IF;
    
    -- Create new reschedule proposal
    INSERT INTO reschedule_proposals (
        id,
        proposed_time,
        receiver,
        proposer,
        proposed_at
    ) VALUES (
        appointment_id,
        tstzrange(proposed_start_time, proposed_end_time),
        receiver,
        proposer,
        timezone('utc'::text, now())
    ) RETURNING * INTO new_proposal;
    
    -- Update appointment status to reschedule_in_progress
    UPDATE appointments 
    SET status = 'reschedule_in_progress', updated_at = timezone('utc'::text, now())
    WHERE id = appointment_id;
    
    -- Build result JSON
    result := json_build_object(
        'id', new_proposal.id,
        'proposed_time', array[lower(new_proposal.proposed_time), upper(new_proposal.proposed_time)],
        'receiver', new_proposal.receiver,
        'proposer', new_proposal.proposer,
        'proposed_at', new_proposal.proposed_at
    );
    
    RAISE NOTICE 'Reschedule proposal created for appointment %', appointment_id;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create reschedule proposal: %', SQLERRM;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION reschedule(uuid, timestamptz, timestamptz, text, text) IS 'Creates a reschedule proposal, deleting any existing one, and updates appointment status to reschedule_in_progress';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reschedule(uuid, timestamptz, timestamptz, text, text) TO authenticated; 
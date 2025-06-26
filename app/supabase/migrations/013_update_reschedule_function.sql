-- Update reschedule function to handle arrays of time ranges
CREATE OR REPLACE FUNCTION reschedule(
    appointment_id uuid,
    proposed_start_times timestamptz[],
    proposed_end_times timestamptz[],
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
    time_ranges tstzrange[];
    i integer;
BEGIN
    -- Validate input parameters
    IF appointment_id IS NULL THEN
        RAISE EXCEPTION 'appointment_id cannot be null';
    END IF;
    
    IF proposed_start_times IS NULL OR proposed_end_times IS NULL THEN
        RAISE EXCEPTION 'proposed_start_times and proposed_end_times cannot be null';
    END IF;
    
    IF array_length(proposed_start_times, 1) != array_length(proposed_end_times, 1) THEN
        RAISE EXCEPTION 'proposed_start_times and proposed_end_times arrays must have the same length';
    END IF;
    
    IF receiver IS NULL OR proposer IS NULL THEN
        RAISE EXCEPTION 'receiver and proposer cannot be null';
    END IF;
    
    -- Validate time ranges
    FOR i IN 1..array_length(proposed_start_times, 1) LOOP
        IF proposed_end_times[i] <= proposed_start_times[i] THEN
            RAISE EXCEPTION 'proposed_end_time must be after proposed_start_time for range %', i;
        END IF;
    END LOOP;
    
    -- Check if appointment exists
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id) THEN
        RAISE EXCEPTION 'Appointment not found with id: %', appointment_id;
    END IF;
    
    -- Build time ranges array
    time_ranges := ARRAY[]::tstzrange[];
    FOR i IN 1..array_length(proposed_start_times, 1) LOOP
        time_ranges := array_append(time_ranges, tstzrange(proposed_start_times[i], proposed_end_times[i]));
    END LOOP;
    
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
        time_ranges,
        receiver,
        proposer,
        timezone('utc'::text, now())
    ) RETURNING * INTO new_proposal;
    
    -- Update appointment status to reschedule_in_progress
    UPDATE appointments 
    SET status = 'reschedule_in_progress', updated_at = timezone('utc'::text, now())
    WHERE id = appointment_id;
    
    -- Build result JSON with array of time ranges
    result := json_build_object(
        'id', new_proposal.id,
        'proposed_time', (
            SELECT json_agg(
                json_build_array(
                    lower(unnest(new_proposal.proposed_time)),
                    upper(unnest(new_proposal.proposed_time))
                )
            )
        ),
        'receiver', new_proposal.receiver,
        'proposer', new_proposal.proposer,
        'proposed_at', new_proposal.proposed_at
    );
    
    RAISE NOTICE 'Reschedule proposal created for appointment % with % time ranges', appointment_id, array_length(time_ranges, 1);
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create reschedule proposal: %', SQLERRM;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION reschedule(uuid, timestamptz[], timestamptz[], text, text) IS 'Creates a reschedule proposal with multiple time ranges, deleting any existing one, and updates appointment status to reschedule_in_progress';
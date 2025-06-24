-- Modify reschedule_proposals table to support multiple time ranges
-- Change proposed_time from single tstzrange to array of tstzrange

-- Alter the column type directly
ALTER TABLE reschedule_proposals 
ALTER COLUMN proposed_time TYPE tstzrange[] USING ARRAY[proposed_time];

-- Update comments to reflect the change
COMMENT ON TABLE reschedule_proposals IS 'Stores reschedule proposals for appointments with multiple time range options';
COMMENT ON COLUMN reschedule_proposals.proposed_time IS 'Array of proposed time ranges for the appointment'; 
-- Create reschedule_proposals table
CREATE TABLE reschedule_proposals (
    id uuid PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
    proposed_time tstzrange NOT NULL,
    receiver text NOT NULL,
    proposer text NOT NULL,
    proposed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on receiver for faster lookups
CREATE INDEX reschedule_proposals_receiver_idx ON reschedule_proposals (receiver);

-- Add comment to clarify the table purpose
COMMENT ON TABLE reschedule_proposals IS 'Stores reschedule proposals for appointments';

-- Add comments to columns
COMMENT ON COLUMN reschedule_proposals.id IS 'References the appointment ID';
COMMENT ON COLUMN reschedule_proposals.proposed_time IS 'The proposed new time range for the appointment';
COMMENT ON COLUMN reschedule_proposals.receiver IS 'The user who receives the reschedule proposal';
COMMENT ON COLUMN reschedule_proposals.proposer IS 'The user who proposes the reschedule';
COMMENT ON COLUMN reschedule_proposals.proposed_at IS 'When the proposal was created'; 
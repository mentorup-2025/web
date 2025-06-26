export interface RescheduleProposal {
    id: string;
    proposed_time: [string, string][]; // Array of [start_time, end_time] pairs
    receiver: string;
    proposer: string;
    proposed_at: string;
}

export interface CreateRescheduleProposalInput {
    appointment_id: string;
    proposed_time_ranges: [string, string][];  // Array of [start_time, end_time] pairs
    receiver: string;
    proposer: string;
}

export interface DeleteRescheduleProposalInput {
    appointment_id: string;
} 
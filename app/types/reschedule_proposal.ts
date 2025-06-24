export interface RescheduleProposal {
    id: string;
    proposed_time: [string, string]; // [start_time, end_time] as tstzrange
    receiver: string;
    proposer: string;
    proposed_at: string;
}

export interface CreateRescheduleProposalInput {
    appointment_id: string;
    proposed_start_time: string;  // ISO string format
    proposed_end_time: string;    // ISO string format
    receiver: string;
    proposer: string;
}

export interface DeleteRescheduleProposalInput {
    appointment_id: string;
} 
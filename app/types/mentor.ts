export interface Mentor {
    user_id: string;
    role: string;
    industry: string;
    created_at?: string;
}

export interface UpsertMentorInput {
    role: string;
    industry: string;
}

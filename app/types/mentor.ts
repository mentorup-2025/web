export interface Mentor {
    user_id: string;
    title: string;                   // e.g. "Senior Software Engineer"
    company: string;                 // Current company
    years_of_experience: number;
    years_of_experience_recorded_date: string;  // ISO date when experience was recorded
    introduction: string;            // Mentor's bio/introduction
    industries: string[];            // List of industries
    services: Record<string, number>; // Map of service name to price
    created_at: string;
}

export interface UpsertMentorInput {
    title: string;
    company: string;
    years_of_experience: number;
    years_of_experience_recorded_date: string;
    introduction: string;
    industries: string[];
    services: Record<string, number>; // e.g. { "consultation": 100, "resume_review": 50 }
}

// Example of services:
// {
//   "consultation": 100,
//   "resume_review": 50,
//   "mock_interview": 150,
//   "career_guidance": 80
// }

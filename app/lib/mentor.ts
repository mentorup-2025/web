import { getSupabaseClient } from '../services/supabase';
import { Mentor, UpsertMentorInput } from '@/types';

// Helper to convert UpsertMentorInput to Mentor
export const createMentorData = (
    userId: string, 
    input: UpsertMentorInput,
    existing?: boolean
): Mentor => ({
    user_id: userId,
    title: input.title,
    company: input.company,
    years_of_experience: input.years_of_experience,
    years_of_experience_recorded_date: input.years_of_experience_recorded_date,
    services: input.services || '',
    created_at: existing ? new Date().toISOString() : new Date().toISOString()
});

export async function upsertMentor(userId: string, input: UpsertMentorInput): Promise<Mentor> {
    try {
        const { data: existing } = await getSupabaseClient()
            .from('mentors')
            .select()
            .eq('user_id', userId)
            .single();

        const mentorData = createMentorData(userId, input, !!existing);

        const { data, error } = await getSupabaseClient()
            .from('mentors')
            .upsert(mentorData)
            .select()
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error in upsertMentor:', error);
        throw error;
    }
}

export async function updateMentor(
    userId: string,
    updates: Partial<UpsertMentorInput>
): Promise<Mentor> {
    try {
        const { data, error } = await getSupabaseClient()
            .from('mentors')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data!;
    } catch (err) {
        console.error('Error in updateMentor:', err);
        throw err;
    }
}
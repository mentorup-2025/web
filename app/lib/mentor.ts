import { getSupabaseClient } from '../services/supabase';
import { Mentor } from '../types/mentor';

export async function upsertMentor(mentor: Mentor): Promise<Mentor> {
    try {
        // Check if mentor exists
        const { data: existing } = await getSupabaseClient()
            .from('mentors')
            .select('user_id')
            .eq('user_id', mentor.user_id)
            .single();

        const mentorData = {
            user_id: mentor.user_id,
            role: mentor.role,
            industry: mentor.industry,
            ...(existing ? {} : { created_at: new Date().toISOString() })
        };

        const { data, error } = await getSupabaseClient()
            .from('mentors')
            .upsert(mentorData)
            .select()
            .single();

        if (error) {
            console.error('Error upserting mentor:', error);
            throw error;
        }

        if (!data) {
            throw new Error('Failed to upsert mentor');
        }

        return data as Mentor;

    } catch (error) {
        console.error('Error in upsertMentor:', error);
        throw error;
    }
}
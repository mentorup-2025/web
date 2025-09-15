import { NextRequest } from 'next/server';
import { respData, respErr } from '@/lib/resp';
import { getSupabaseClient } from '@/services/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseClient();
        
        // Call the Supabase function to get mentor IDs with availability in next 7 days
        const { data, error } = await supabase.rpc('get_available_mentor_ids_next_7_days');

        if (error) {
            console.error('❌ Error calling get_available_mentor_ids_next_7_days:', error);
            return respErr('Failed to fetch available mentors');
        }

        // The function should return an array of user IDs
        const mentorIds: string[] = data || [];

        console.log('✅ Available mentors fetched successfully:', {
            count: mentorIds.length,
            mentorIds: mentorIds.slice(0, 5) // Log first 5 for debugging
        });

        return respData(mentorIds);

    } catch (error) {
        console.error('❌ Error fetching available mentors:', error);
        return respErr('Failed to fetch available mentors');
    }
}

export const revalidate = 300; // Cache for 5 minutes since availability changes frequently

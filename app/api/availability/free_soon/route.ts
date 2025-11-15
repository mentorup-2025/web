import { NextRequest } from 'next/server';
import { respData, respErr } from '@/lib/resp';
import { getSupabaseClient } from '@/services/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.rpc('get_available_mentor_ids_next_7_days_v2');

        if (error) {
            console.error('RPC error:', error);
            return respErr('Failed to fetch mentors');
        }

        // data: [{ mentor_id: "u1" }, { mentor_id: "u2" }]
        const mentorIds = (data ?? []).map((row: any) => row.mentor_id);

        console.log('Available mentors:', mentorIds);

        // ➜ 返回纯字符串数组
        return respData(mentorIds);

    } catch (err) {
        console.error('Error:', err);
        return respErr('Failed to fetch mentors');
    }
}

export const revalidate = 300;
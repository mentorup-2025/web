// app/api/temp-holds/[mentorId]/route.ts
import { supabase } from '@/services/supabase';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { mentorId: string } }) {
    try {
        const { mentorId } = params;

        const { data, error } = await supabase
            .from('temp_holds')
            .select('mentor_id, time_slot')
            .eq('mentor_id', mentorId)
            .is('expires_at', null);

        if (error) throw error;

        return Response.json({ code: 0, data });
    } catch (err) {
        console.error('Error fetching held slots:', err);
        return Response.json({ code: 1, error: 'Failed to fetch holds' }, { status: 500 });
    }
}

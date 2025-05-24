// app/api/booking/confirm/route.ts
import { supabase } from '@/services/supabase';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { appointmentId } = await req.json();

        const { data: appt, error } = await supabase
            .from('appointments')
            .select('mentor_id, time_slot')
            .eq('id', appointmentId)
            .single();

        if (error || !appt) throw error;

        const now = new Date().toISOString();

        const { data: updatedAppt, error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed', updated_at: now })
            .eq('id', appointmentId)
            .select()
            .single();

        if (updateError) {
            console.error('Appointment update failed:', updateError);
        } else {
            console.log('✅ Updated appointment:', updatedAppt);
        }

        await supabase
            .from('temp_holds')
            .update({ expires_at: now })
            .eq('mentor_id', appt.mentor_id)
            .eq('time_slot', appt.time_slot);

        return Response.json({ ok: true });
    } catch (err) {
        console.error('Booking confirm error:', err);
        return Response.json({ error: 'Failed to confirm appointment' }, { status: 500 });
    }
}

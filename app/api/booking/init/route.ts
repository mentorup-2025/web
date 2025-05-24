// app/api/booking/init/route.ts
import { supabase } from '@/services/supabase';
import { NextRequest } from 'next/server';
import dayjs from 'dayjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            mentorId, menteeId, date, time, serviceType, description, resumeUrl
        } = body;

        const [startStr, endStr] = time.split(' - ');
        const start = dayjs(`${date} ${startStr}`).toISOString();
        const end = dayjs(`${date} ${endStr}`).toISOString();
        const timeSlot = `[${start},${end})`;

        // ✅ Step 1: Check if this slot is already booked
        const { count, error: checkError } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('mentor_id', mentorId)
            .overlaps('time_slot', timeSlot)
            .not('status', 'eq', 'canceled');

        if (checkError) {
            console.error('Check existing appointment failed:', checkError);
            return Response.json({ error: 'Internal error during slot check' }, { status: 500 });
        }

        if (count > 0) {
            return Response.json({ error: 'This time slot is already booked.' }, { status: 409 });
        }

        const now = new Date().toISOString();

        // ✅ Step 2: Insert new appointment
        const { data: appointmentData, error: apptError } = await supabase
            .from('appointments')
            .insert({
                mentor_id: mentorId,
                mentee_id: menteeId,
                time_slot: timeSlot,
                status: 'pending',
                service_type: serviceType,
                description,
                resume_url: resumeUrl,
                updated_at: now,
                price: 15
            })
            .select()
            .single();

        if (apptError) {
            if (apptError.code === '23P01') {
                return Response.json({ error: 'This time slot is already booked.' }, { status: 409 });
            }
            console.error('Appointment insert error:', apptError);
            throw apptError;
        }

        // ✅ Step 3: Insert hold for this time slot
        const { error: holdError } = await supabase
            .from('temp_holds')
            .insert({
                mentor_id: mentorId,
                mentee_id: menteeId,
                time_slot: timeSlot,
                expires_at: null
            });

        if (holdError) {
            console.error('Temp hold insert error:', holdError);
            throw holdError;
        }

        return Response.json({ appointmentId: appointmentData.id });
    } catch (err) {
        console.error('Booking init error:', err);
        return Response.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
}

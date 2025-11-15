import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../../services/supabase';

// GET: 获取用户当前时区
export async function GET(_: Request, { params }: { params: { id: string } }) {
    const supabase = getSupabaseClient();
    const userId = params.id;

    const { data, error } = await supabase
        .from('users')
        .select('timezone')
        .eq('user_id', userId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
}

// PATCH: 更新用户时区
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const supabase = getSupabaseClient();
    const userId = params.id;
    const body = await req.json();

    if (!body.timezone) {
        return NextResponse.json({ error: "Missing timezone" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('users')
        .update({ timezone: body.timezone })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
// app/api/mentor_list/route.ts
import { supabase } from "@/app/supabase/client";
import { NextResponse } from 'next/server';

// 获取 mentor 列表
export async function GET() {
    const { data, error } = await supabase
        .from('mentor_list') // ✅ 修改表名
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// 添加新 mentor
export async function POST(req: Request) {
    const body = await req.json();

    const { data, error } = await supabase
        .from('mentor_list') // ✅ 修改表名
        .insert([body])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
}
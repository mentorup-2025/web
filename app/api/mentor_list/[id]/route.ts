import { supabase } from "@/app/supabase/client";
import { NextResponse } from 'next/server';

// 获取单个 mentor by id
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    const { data, error } = await supabase
        .from('mentor_list')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(data);
}

// 更新 mentor by id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const updates = await request.json();

    const { data, error } = await supabase
        .from('mentor_list')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
}

// 删除 mentor by id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    const { error } = await supabase
        .from('mentor_list')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Mentor ${id} deleted.` });
}
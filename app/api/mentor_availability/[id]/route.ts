import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase/client"; // 确保 Supabase 连接正确

// ✅ 1️⃣ 获取 mentor_availability 记录（GET - Read）
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id; // 获取 URL 参数 `id`

    const { data, error } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("id", id)
        .single(); // 只获取一条数据

    if (error || !data) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 2️⃣ 更新 mentor_availability 记录（PUT - Update）
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id; // 获取 URL 参数 `id`
    const { day_of_week, start_time, end_time } = await request.json();

    const { data, error } = await supabase
        .from("mentor_availability")
        .update({ day_of_week, start_time, end_time })
        .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Availability updated successfully", data });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 3️⃣ 删除 mentor_availability 记录（DELETE - Delete）
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id; // 获取 URL 参数 `id`

    const { error } = await supabase
        .from("mentor_availability")
        .delete()
        .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Availability deleted successfully" });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
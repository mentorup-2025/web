import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase/client";

// ✅ 获取 mentor_availability 记录（GET）
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { data, error } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 更新 mentor_availability 记录（PUT）
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { start_time, end_time, status } = await request.json();

    const start = new Date(start_time);
    const end = new Date(end_time);

    // 🔹 确保时间是整点
    if (start.getMinutes() !== 0 || start.getSeconds() !== 0 || end.getMinutes() !== 0 || end.getSeconds() !== 0) {
      return NextResponse.json({ error: "start_time 和 end_time 必须是整点" }, { status: 400 });
    }

    // 🔹 先获取 `id` 对应的 `user_id`
    const { data: existingData, error: fetchError } = await supabase
        .from("mentor_availability")
        .select("user_id")
        .eq("id", id)
        .single();

    if (fetchError || !existingData) {
      return NextResponse.json({ error: "Record not found or user_id missing" }, { status: 404 });
    }

    const user_id = existingData.user_id;

    // 🔹 先删除原有的 ID 记录
    const { error: deleteError } = await supabase.from("mentor_availability").delete().eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete old availability", details: deleteError.message }, { status: 500 });
    }

    // 🔹 计算需要插入的时间段（每小时一行）
    const slots = [];
    let currentTime = new Date(start);

    while (currentTime < end) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1); // +1 小时

      if (nextHour > end) break; // 避免超过 end_time

      slots.push({
        user_id, // ✅ 确保 `user_id` 仍然存在
        start_time: currentTime.toISOString(),
        end_time: nextHour.toISOString(),
        status,
      });

      currentTime = nextHour; // 更新 start_time
    }

    // 🔹 插入新的数据
    const { data, error } = await supabase.from("mentor_availability").insert(slots);

    if (error) {
      return NextResponse.json({ error: "Failed to update availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Availability updated successfully", data });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 删除 mentor_availability 记录（DELETE）
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
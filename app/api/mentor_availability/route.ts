import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase/client";

// 🔹 辅助函数：拆分时间段，每小时一行
function splitIntoHourlySlots(start_time: string, end_time: string, user_id: string, status: string = "available") {
  const slots = [];
  let start = new Date(start_time);
  const end = new Date(end_time);

  while (start < end) {
    const nextHour = new Date(start);
    nextHour.setHours(start.getHours() + 1); // +1 小时

    if (nextHour > end) break; // 避免超过 end_time

    slots.push({
      user_id,
      start_time: start.toISOString(),
      end_time: nextHour.toISOString(),
      status,
    });

    start = nextHour; // 更新 start_time
  }

  return slots;
}

// ✅ 创建 mentor_availability 记录（POST）
export async function POST(request: Request) {
  try {
    const { user_id, start_time, end_time, status } = await request.json();

    const start = new Date(start_time);
    const end = new Date(end_time);

    // 🔹 确保时间是整点
    if (start.getMinutes() !== 0 || start.getSeconds() !== 0 || end.getMinutes() !== 0 || end.getSeconds() !== 0) {
      return NextResponse.json({ error: "start_time 和 end_time 必须是整点" }, { status: 400 });
    }

    // 🔹 确保 end_time > start_time
    if (end <= start) {
      return NextResponse.json({ error: "end_time 必须大于 start_time" }, { status: 400 });
    }

    // 🔹 计算需要插入的时间段（每小时一行）
    const slots = splitIntoHourlySlots(start_time, end_time, user_id, status);

    if (slots.length === 0) {
      return NextResponse.json({ error: "时间范围无效" }, { status: 400 });
    }

    // 🔹 插入数据库
    const { data, error } = await supabase.from("mentor_availability").insert(slots);

    if (error) {
      return NextResponse.json({ error: "Failed to create availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 获取所有 mentor_availability 记录（GET）
export async function GET() {
  try {
    const { data, error } = await supabase
        .from("mentor_availability")
        .select("*");

    if (error) {
      return NextResponse.json({ error: "Failed to get availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
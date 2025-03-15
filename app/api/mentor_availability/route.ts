import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase/client"; // 确保你的 Supabase 连接正确

export async function POST(request: Request) {
  try {
    // 🔹 1️⃣ 获取请求体数据
    const { user_id, day_of_week, start_time, end_time } = await request.json();

    // 🔹 2️⃣ 插入 mentor_availability
    const { data, error } = await supabase
        .from("mentor_availability")
        .insert([
          {
            user_id: user_id || null, // ✅ 允许 `user_id` 为空（匿名插入）
            day_of_week,
            start_time,
            end_time,
          },
        ]);

    if (error) {
      return NextResponse.json({ error: "Failed to set availability", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });

  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
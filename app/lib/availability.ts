import { getSupabaseClient } from '../services/supabase';
import { BlockAvailabilityInput, isValidAvailability, SetAvailabilityInput } from '@/types';

export async function setRegularAvailability(input: SetAvailabilityInput): Promise<void> {
    try {
        const invalidSlots = input.availabilities.filter((slot) => !isValidAvailability(slot));
        if (invalidSlots.length > 0) {
            throw new Error("Invalid availability slots provided");
        }

        const supabase = getSupabaseClient();

        const { data, error } = await supabase.rpc("set_weekly_availability", {
            p_mentor_id: input.user_id,
            availability: input.availabilities.map((slot) => ({
                day_of_week: slot.day_of_week, // 0-6
                start_time: slot.start_time,   // "HH:mm" 本地墙上时间
                end_time: slot.end_time,       // "HH:mm"
            })),
        });

        if (error) {
            console.error("Error setting availability:", error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error in setRegularAvailability:", error);
        throw error;
    }
}

export async function getMentorAvailabilitySetup(mentor_id: string) {
    const { data, error } = await getSupabaseClient()
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentor_id);
  
    if (error) {
      throw new Error(`Failed to fetch mentor availability: ${error.message}`);
    }
  
    return data;
  }

export async function getMentorAvailability(input: { 
    mentor_id: string, 
    start_date: Date, 
    end_date: Date 
}): Promise<any[]> {
    try {
        const { data, error } = await getSupabaseClient()
            .rpc('get_mentor_availability', {
                p_mentor_id: input.mentor_id,
                start_date: input.start_date,
                end_date: input.end_date
            });

        if (error) {
            console.error('Error getting mentor availability:', error);
            throw error;
        }

        return data || [];

    } catch (error) {
        console.error('Error in getMentorAvailability:', error);
        throw error;
    }
}

export async function blockAvailability(input: BlockAvailabilityInput): Promise<void> {
    try {
        // For single day blocks or date ranges, we want to block the entire day(s)
        const startDateTime = `${input.start_date}`;  // Start of day in UTC（在前端里直接计算好了utc时间传入这里）
        const endDateTime = `${input.end_date}`;  // End of day in UTC（在前端里直接计算好了utc时间传入这里）

        // Insert block into mentor_blocks table
        const { error } = await getSupabaseClient()
            .from('mentor_blocks')
            .insert({
                mentor_id: input.mentor_id,
                // Use timestamptz range for the entire day(s)
                blocked_range: `[${startDateTime},${endDateTime}]`,
            });

        if (error) {
            console.error('Error blocking availability:', error);
            throw error;
        }

    } catch (error) {
        console.error('Error in blockAvailability:', error);
        throw error;
    }
}


export async function getMentorDailyAvailability(mentor_id: string, date: Date): Promise<any[]> {
    try {
        const { data, error } = await getSupabaseClient()
            .rpc('get_mentor_daily_availability', {
                p_mentor_id: mentor_id,
                query_date: date
            });

        if (error) {
            console.error('Error getting mentor daily availability:', error);
            throw error;
        }

        // RPC returns array of available time slots
        return data || [];

    } catch (error) {
        console.error('Error in getMentorDailyAvailability:', error);
        throw error;
    }
} 

export async function getMentorBlocks(mentor_id: string): Promise<any[]> {
    try {

        // Query mentor_blocks table for blocks that overlap with the given date
        const { data, error } = await getSupabaseClient()
            .from('mentor_blocks')
            .select('*')
            .eq('mentor_id', mentor_id);

        if (error) {
            console.error('Error getting mentor blocks:', error);
            throw error;
        }

        return data || [];

    } catch (error) {
        console.error('Error in getMentorBlock:', error);
        throw error;
    }
}

export async function deleteMentorBlock(mentor_id: string, block_id: string): Promise<void> {
    try {
        // Delete block with the given ID
        const { error } = await getSupabaseClient()
            .from('mentor_blocks')
            .delete()
            .eq('mentor_id', mentor_id)
            .eq('id', block_id);

        if (error) {
            // If the error is not a "not found" error, then throw it
            if (!error.message.includes('not found')) {
                console.error('Error deleting mentor block:', error);
                throw error;
            }
            // Otherwise, ignore the error (block already deleted)
            console.log(`Block ${block_id} already deleted or doesn't exist`);
        }

    } catch (error) {
        // Only throw if it's not a "not found" error
        if (error instanceof Error && !error.message.includes('not found')) {
            console.error('Error in deleteMentorBlock:', error);
            throw error;
        }
    }
}

export async function upsertUserTimezone(userId: string, timezone: string): Promise<void> {
    if (!timezone) return;

    const supabase = getSupabaseClient();

    // 可选：如果已经有相同 timezone 就不更新
    const { data: existing, error: readErr } = await supabase
        .from("users")
        .select("timezone")
        .eq("id", userId)
        .single();

    if (readErr) {
        console.error("Failed to read user timezone before update:", readErr);
        // 读失败可以继续尝试写
    }

    if (existing && existing.timezone === timezone) {
        // 已经是这个时区了，不必更新
        return;
    }

    const { error: updateErr } = await supabase
        .from("users")
        .update({ timezone })
        .eq("id", userId);

    if (updateErr) {
        console.error("Failed to update user timezone:", updateErr);
        throw updateErr;
    }

    console.log(`User ${userId} timezone set to ${timezone}`);
}

export async function setRegularAvailabilityV2(
    input: SetAvailabilityInput
): Promise<void> {
    const supabase = getSupabaseClient();

    const { user_id, availabilities } = input;

    // 1. 清空旧的数据
    const { error: delErr } = await supabase
        .from("mentor_weekly_availability_v2")
        .delete()
        .eq("mentor_id", user_id);

    if (delErr) {
        console.error("Delete availability v2 error:", delErr);
        throw delErr;
    }

    // 2. 插入新的本地时间段
    const rows = availabilities.map((slot) => ({
        mentor_id: user_id,
        day_of_week: slot.day_of_week,      // 0–6
        start_time_local: slot.start_time,  // "HH:mm"
        end_time_local: slot.end_time,      // "HH:mm"
    }));

    const { error: insErr } = await supabase
        .from("mentor_weekly_availability_v2")
        .insert(rows);

    if (insErr) {
        console.error("Insert availability v2 error:", insErr);
        throw insErr;
    }

    return;
}
/**
 * v2：给「区间视图」用，例如：某 mentor 在 [start_date, end_date] 这段时间所有可用 UTC 段
 * 返回值结构由 SQL 里的 RETURNS TABLE 决定
 */
export async function getMentorAvailabilityV2(input: {
    mentor_id: string;
    start_date: Date;
    end_date: Date;
}): Promise<
    {
        start_utc: string; // ISO 字符串
        end_utc: string;
    }[]
    > {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.rpc(
            "get_mentor_availability_v2",
            {
                p_mentor_id: input.mentor_id,
                // supabase-js 能直接接受 JS Date，这里用 toISOString 也行
                p_start: input.start_date.toISOString(),
                p_end: input.end_date.toISOString(),
            }
        );

        if (error) {
            console.error("Error getting mentor availability v2:", error);
            throw error;
        }

        return (data as any[]) || [];
    } catch (error) {
        console.error("Error in getMentorAvailabilityV2:", error);
        throw error;
    }
}

/**
 * v2：查询某一天（mentor 本地日期）的可用时间段
 */
export async function getMentorDailyAvailabilityV2(
    mentor_id: string,
    date: Date
): Promise<
    {
        start_local: string; // "HH:mm"
        end_local: string;   // "HH:mm"
        start_utc: string;   // ISO
        end_utc: string;     // ISO
    }[]
    > {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.rpc(
            "get_mentor_daily_availability_v2",
            {
                p_mentor_id: mentor_id,
                // RPC 里我用 date 类型，所以传 "YYYY-MM-DD"
                p_date: date.toISOString().slice(0, 10),
            }
        );

        if (error) {
            console.error("Error getting mentor daily availability v2:", error);
            throw error;
        }

        return (data as any[]) || [];
    } catch (error) {
        console.error("Error in getMentorDailyAvailabilityV2:", error);
        throw error;
    }
}

export async function getMentorAvailabilitySetupV2(mentor_id: string) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('mentor_weekly_availability_v2')
        .select('id, mentor_id, day_of_week, start_time_local, end_time_local')
        .eq('mentor_id', mentor_id)
        .order('day_of_week', { ascending: true })
        .order('start_time_local', { ascending: true });

    if (error) {
        console.error('[getMentorAvailabilitySetupV2] supabase error', error);
        throw error;
    }

    return data ?? [];
}
import { respData, respErr } from '@/lib/resp';
import { supabase } from '@/services/supabase';
import { getUser } from '@/lib/user';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const url = new URL(request.url);
        const start_date = url.searchParams.get('start_date');
        const end_date = url.searchParams.get('end_date');

        if (!start_date || !end_date) {
            return respErr('Missing required parameters: start_date, end_date');
        }

        // 1) 验证用户是否是 Mentor
        const user = await getUser(params.id);
        if (!user?.mentor) {
            return respErr('User is not a mentor');
        }

        // 2) 调用 v2 SQL RPC —— 输出 start_utc + end_utc
        const { data, error } = await supabase.rpc(
            'get_mentor_availability_v2',
            {
                p_mentor_id: params.id,
                p_start_date: start_date, // 字符串 OK
                p_end_date: end_date
            }
        );

        if (error) {
            console.error('❌ RPC error get_mentor_availability_v2:', error);
            return respErr('Failed to fetch availability');
        }

        const slots = data ?? [];

        // 3) 转成前端能识别的格式：
        //
        // 前端需要：
        // data = [
        //    { slot_time: '["2025-11-03T16:00:00Z","2025-11-04T02:00:00Z"]' }
        // ]
        //
        const formatted = slots.map((s: any) => ({
            slot_time: `["${s.start_utc}","${s.end_utc}"]`
        }));

        // 4) 输出必须是数组，而不是 object
        return respData(formatted);

    } catch (error) {
        console.error('❌ Error in /availability/[id]/view:', error);
        return respErr('Failed to get availability');
    }
}
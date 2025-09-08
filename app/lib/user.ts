import { getSupabaseClient } from '../services/supabase';
import { User, CreateUserInput, UpdateUserInput } from '@/types';

export async function createUser(input: CreateUserInput): Promise<User> {
    try {
        const { data: existingUser } = await getSupabaseClient()
            .from('users')
            .select()
            .eq('user_id', input.user_id)
            .single();

        if (existingUser) {
            console.log('User already exists, returning existing user');
            return existingUser as User;
        }

        const userData = {
            user_id: input.user_id,
            username: input.username,
            email: input.email,
            github: input.github,
            linkedin: input.linkedin,
            resume: input.resume,
            industries: input.industries,
            wechat: input.wechat,
            status: input.status,
            created_at: new Date().toISOString(),
            profile_url: input.profile_url,
            introduction: input.introduction,
            payout_preference: input.payout_preference,
        };

        const { data, error } = await getSupabaseClient()
            .from('users')
            .insert(userData)
            .select()   // 保留所有字段，避免漏字段导致前端用到 undefined
            .single();

        if (error) throw error;
        return data as User;
    } catch (error) {
        console.error('Error in createUser:', error);
        throw error;
    }
}

export async function getUser(id: string): Promise<User | null> {
    try {
        const { data, error } = await getSupabaseClient()
            .from('users')
            .select(`
        *,
        mentor:mentors(*)
      `)
            .eq('user_id', id)
            .single();

        if ((error as any)?.code === 'PGRST116') return null;
        if (error) {
            console.error('Error in getUser:', error);
            throw error;
        }

        // 归一化：mentor 从数组转单对象；industries 兜底为 []
        const normalized = data
            ? ({
                ...data,
                industries: Array.isArray((data as any).industries) ? (data as any).industries : [],
                mentor: Array.isArray((data as any).mentor) ? (data as any).mentor[0] ?? null : (data as any).mentor ?? null,
            } as User)
            : null;

        return normalized;
    } catch (error) {
        console.error('Error in getUser:', error);
        throw error;
    }
}

export async function listMentorUsers(): Promise<User[]> {
    try {
        const { data, error } = await getSupabaseClient()
            .from('users')
            .select(`
        *,
        mentor:mentors!inner(*)
      `)
            // 默认排序：按 mentors.default_ranking 升序，NULLS LAST
            .order('default_ranking', {
                foreignTable: 'mentors',
                ascending: true,
                nullsFirst: false,
            });

        if (error) throw error;

        // 归一化：mentor 数组->单对象；industries 兜底 []
        const normalized = (data ?? []).map((row: any) => ({
            ...row,
            industries: Array.isArray(row.industries) ? row.industries : [],
            mentor: Array.isArray(row.mentor) ? row.mentor[0] ?? null : row.mentor ?? null,
        })) as User[];

        return normalized;
    } catch (error) {
        console.error('Error in listMentorUsers:', error);
        throw error;
    }
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    try {
        const updateData = Object.entries(input).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {} as Record<string, any>);

        if (Object.keys(updateData).length === 0) {
            return (await getUser(userId)) as User;
        }

        const { data, error } = await getSupabaseClient()
            .from('users')
            .update(updateData)
            .eq('user_id', userId)
            .select(`
        *,
        mentor:mentors(*)
      `)
            .single();

        if (error) {
            console.error('Error updating user:', error);
            throw error;
        }

        const normalized = {
            ...data,
            industries: Array.isArray((data as any).industries) ? (data as any).industries : [],
            mentor: Array.isArray((data as any).mentor) ? (data as any).mentor[0] ?? null : (data as any).mentor ?? null,
        } as User;

        return normalized;
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw error;
    }
}

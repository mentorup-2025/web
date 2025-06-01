import { getSupabaseClient } from '../services/supabase';
import { User, CreateUserInput, UpdateUserInput } from '@/types';

export async function createUser(input: CreateUserInput): Promise<User> {
    try {
        // Check if user already exists
        const { data: existingUser } = await getSupabaseClient()
            .from('users')
            .select()
            .eq('user_id', input.user_id)
            .single();

        // If user exists, return the existing user
        if (existingUser) {
            console.log('User already exists, returning existing user');
            return existingUser;
        }

        // Prepare user data
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
            profile_url: input.profile_url
        };

        // Insert user into database
        const { data, error } = await getSupabaseClient()
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) throw error;
        return data;

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

        // 如果是 not found 错误，返回 null
        if (error?.code === 'PGRST116') {  // PostgreSQL not found error code
            return null;
        }

        // 其他错误则抛出
        if (error) {
            console.error('Error in getUser:', error);
            throw error;
        }

        return data;

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
            `);

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('Error in listMentorUsers:', error);
        throw error;
    }
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    try {
        // Filter out null values and create update object
        const updateData = Object.entries(input).reduce((acc, [key, value]) => {
            // Only include fields where value is not null
            if (value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);

        // If no valid updates, return existing user
        if (Object.keys(updateData).length === 0) {
            return await getUser(userId) as User;
        }

        // Update user in database
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

        return data;

    } catch (error) {
        console.error('Error in updateUser:', error);
        throw error;
    }
} 
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../services/supabase';
import { User, CreateUserInput } from '@/types';

export async function createUser(input: CreateUserInput): Promise<User> {
    try {
        // Prepare user data
        const userData = {
            username: input.username,
            email: input.email,
            github: input.github,
            linkedin: input.linkedin,
            resume: input.resume,
            created_at: new Date().toISOString()
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
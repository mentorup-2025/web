import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../services/supabase';
import { CreateUserInput, User } from '@/app/types';


export async function saveUser(input: CreateUserInput): Promise<User> {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(input.password, salt);

    // Prepare user data
    const userData = {
      username: input.username,
      email: input.email,
      password_hash,
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const { data, error } = await getSupabaseClient()
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Username or email already exists');
      }
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create user');
    }

    return data as User;

  } catch (error) {
    console.error('Error in saveUser:', error);
    throw error;
  }
}

export async function getUser(userId: string): Promise<User | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select(`
        *,
        mentor:mentors(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching user:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform the response to match User interface
    return data as User;

  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function listMentorUsers(): Promise<User[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select(`
        *,
        mentor:mentors!inner(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing users:', error);
      throw error;
    }

    return (data || []) as User[];

  } catch (error) {
    console.error('Error in listUsers:', error);
    throw error;
  }
} 
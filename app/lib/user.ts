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
  const { data, error } = await getSupabaseClient()
    .from('users')
    .select('*')
    .eq('user_id', userId) // Changed from user_id to id based on schema
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

  return data as User;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
} 
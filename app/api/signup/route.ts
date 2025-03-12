import {  respJson } from '@/app/lib/resp';
import { saveUser } from '@/app/lib/user';
import { CreateUserInput } from '@/app/types';

export async function POST(request: Request) {
    try {
        const input: CreateUserInput = await request.json();
        
        const user = await saveUser(input);
        
        // Remove password_hash from response
        const { password_hash, ...safeUser } = user;

        return respJson(201, 'user created successfully', user)

    } catch (error) {
        console.error('Registration error:', error);
        return respJson(400, 'Failed to create user');
    }
} 
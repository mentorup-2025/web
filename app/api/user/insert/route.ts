import {  respJson } from '@/app/lib/resp';
import { createUser } from '@/app/lib/user';
import { CreateUserInput } from '@/app/types';

export async function POST(request: Request) {
    try {
        const input: CreateUserInput = await request.json();
        
        const user = await createUser(input);

        return respJson(201, 'user created successfully', user)

    } catch (error) {
        console.error('Registration error:', error);
        return respJson(400, 'Failed to create user');
    }
} 
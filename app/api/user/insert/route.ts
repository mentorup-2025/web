import { respErr, respJson } from '@/lib/resp';
import { createUser } from '@/lib/user';
import { CreateUserInput } from '@/types';

export async function POST(request: Request) {
    try {
        const input: CreateUserInput = await request.json();
        
        // Validate required user_id
        if (!input.user_id) {
            return respErr( 'user_id is required');
        }

        const user = await createUser(input);

        return respJson(0, 'user created successfully', user)

    } catch (error) {
        console.error('Registration error:', error);
        return respErr('Failed to create user');
    }
} 
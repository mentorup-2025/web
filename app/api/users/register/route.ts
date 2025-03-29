import { saveUser } from "@/app/lib/user";
import { CreateUserInput } from "@/app/types";


export async function POST(request: Request) {
    try {
        const input: CreateUserInput = await request.json();
        
        const user = await saveUser(input);
        
        // Remove password_hash from response
        const { password_hash, ...safeUser } = user;

        return new Response(JSON.stringify({
            success: true,
            user: safeUser
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create user'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 
import { respJson } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(params.id);
        
        if (!user) {
            return respJson(404, 'User not found');
        }

        // Remove password_hash from response
        const { password_hash, ...safeUser } = user;
        return respJson(200, 'User found', safeUser);

    } catch (error) {
        console.error('Error fetching user:', error);
        return respJson(500, 'Failed to fetch user');
    }
} 
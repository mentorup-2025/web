import { respJson } from '@/app/lib/resp';
import { getUser } from '@/app/lib/user';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userPromise = getUser(params.id);

        // Check user first while mentor loads in background
        const user = await userPromise;
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
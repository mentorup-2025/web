import { respJson, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(params.id);
        if (!user) {
            return respErr('User not found');
        }

        return respJson(200, 'User found', user);

    } catch (error) {
        console.error('Error in get user:', error);
        return respErr('Failed to get user');
    }
}
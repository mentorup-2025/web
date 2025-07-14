import { upsertMentor } from '@/lib/mentor';
import { respErr, respJson } from '@/lib/resp';
import { auth } from '@clerk/nextjs/server';
import { revalidateTag } from 'next/cache';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get user from Clerk session
        const { userId } = await auth();
        
        if (!userId) {
            return respErr('Unauthorized: User not authenticated');
        }

        // Validate that the authenticated user ID matches the user ID in the URL parameter
        if (userId !== params.id) {
            return respErr('Unauthorized: User ID from session does not match user ID in URL');
        }

        const body = await request.json();
        console.log('API received body:', body);

        const mentor = await upsertMentor(params.id, body);

        revalidateTag('mentorlist');
        console.log(`Mentor profile updated for user ${userId}`);
        
        return respJson(200, 'Mentor updated successfully', mentor);
    } catch (error) {
        console.error('API error:', error);
        return respErr("Failed to upsert mentor");
    }
} 
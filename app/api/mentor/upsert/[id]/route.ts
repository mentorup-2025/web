import { upsertMentor } from '@/lib/mentor';
import { respErr, respJson } from '@/lib/resp';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        console.log('API received body:', body);

        const mentor = await upsertMentor(params.id, body);
        return respJson(200, 'Mentor updated successfully', mentor);
    } catch (error) {
        console.error('API error:', error);
        return respErr("Failed to upsert mentor");
    }
} 
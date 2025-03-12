import { respJson } from '@/app/lib/resp';
import { upsertMentor } from '@/app/lib/mentor';
import { Mentor, UpsertMentorInput } from '@/app/types/mentor';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const input: UpsertMentorInput = await request.json();
        
        // Construct Mentor object
        const mentor: Mentor = {
            user_id: params.id,
            role: input.role,
            industry: input.industry
        };

        const result = await upsertMentor( mentor);
        
        return respJson(200, 'Mentor updated successfully', result);

    } catch (error) {
        console.error('Error upserting mentor:', error);
        return respJson(500, 'Failed to update mentor');
    }
} 
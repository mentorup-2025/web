import { respJson } from '@/lib/resp';
import { listMentorUsers } from '@/lib/user';

export async function GET() {
    try {
        const users = await listMentorUsers();
        
        // Filter to only users who have mentor profiles
        const mentors = users.filter(user => user.mentor !== null);

        return respJson(200, 'Mentors retrieved successfully', mentors);

    } catch (error) {
        console.error('Error fetching mentors:', error);
        return respJson(500, 'Failed to fetch mentors');
    }
}

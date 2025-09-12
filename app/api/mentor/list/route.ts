import { respJson } from '@/lib/resp';
import { listMentorUsers } from '@/lib/user';

export async function GET() {
    try {
        const users = await listMentorUsers();
        
        // Filter to only users who have mentor profiles
        const mentors = users.filter(user => user.mentor !== null);

        const response = respJson(200, 'Mentors retrieved successfully', mentors);
        
        // Add CORS headers to handle server-side fetch from same origin
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return response;

    } catch (error) {
        console.error('Error fetching mentors:', error);
        return respJson(500, 'Failed to fetch mentors');
    }
}

export const revalidate = 0;


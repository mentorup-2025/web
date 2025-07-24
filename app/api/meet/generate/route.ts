import { respJson, respErr } from '@/lib/resp';
import { generateMeetLink } from '@/lib/meet';

export async function POST(request: Request) {
  try {
    const { start_time, end_time, mentor_email, mentee_email } = await request.json();

    // Validate required fields
    if (!start_time || !end_time) {
      return respErr('Start time and end time are required');
    }
    if (!mentor_email || !mentee_email) {
      return respErr('Mentor email and mentee email are required');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mentor_email) || !emailRegex.test(mentee_email)) {
      return respErr('Invalid email format');
    }

    // Use the helper
    const meet = await generateMeetLink({ start_time, end_time, mentor_email, mentee_email });
    return respJson(0, 'Google Meet link generated successfully', meet);
  } catch (error) {
    console.error('Error creating Google Meet link:', error);
    return respErr('Failed to generate Google Meet link');
  }
}
import { Meet } from '@/types/meet';
const { google } = require('googleapis');
const { v4: uuid } = require('uuid');

export async function generateMeetLink({
  start_time,
  end_time,
  mentor_email,
  mentee_email
}: {
  start_time: string;
  end_time: string;
  mentor_email: string;
  mentee_email: string;
}): Promise<Meet> {
  // Validate time
  const eventStartTime = new Date(start_time);
  const eventEndTime = new Date(end_time);

  // 1. AUTHENTICATION
  const credentialsJsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  console.log('🔍 Debug: GOOGLE_APPLICATION_CREDENTIALS_JSON exists:', !!credentialsJsonStr);
  console.log('🔍 Debug: GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID);
  
  if (!credentialsJsonStr) throw new Error('Google credentials not configured');
  
  try {
    const credentials = JSON.parse(credentialsJsonStr);
    console.log('🔍 Debug: Credentials parsed successfully, client_email:', credentials.client_email);
    
    // Use JWT with service account impersonation
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: process.env.GOOGLE_ADMIN_EMAIL  // Impersonate this user
    });
    
    await auth.authorize();
    console.log('🔍 Debug: Google auth authorized successfully');
    console.log('🔍 Debug: Impersonating user:', process.env.GOOGLE_ADMIN_EMAIL);

    // 2. INITIALIZE CALENDAR API
    const calendar = google.calendar({ version: 'v3', auth });

    // 3. DEFINE THE EVENT
    const event = {
      summary: 'MentorUp Appointment Meeting',
      description: 'Meeting scheduled through MentorUp platform.',
      start: {
        dateTime: eventStartTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventEndTime.toISOString(),
        timeZone: 'UTC',
      },
      visibility: 'public',
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      conferenceData: {
        createRequest: {
          requestId: uuid(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: [
        { email: mentor_email },
        { email: mentee_email },
      ],
    };

    // 4. INSERT THE EVENT
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log('🔍 Debug: Using calendar ID:', calendarId);
    
    let response;
    try {
      response = await calendar.events.insert({
        calendarId: calendarId, 
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });
    } catch (calendarError: any) {
      console.log('🔍 Debug: Failed to use specified calendar, trying primary calendar:', calendarError.message);
      
      // Fallback to primary calendar
      response = await calendar.events.insert({
        calendarId: 'primary', 
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });
    }

    const meetLink = response.data.hangoutLink;
    const eventLink = response.data.htmlLink;

    if (!meetLink) {
      throw new Error('Google Calendar did not return a Meet link. Please check your service account and calendar configuration.');
    }

    return {
      meeting_link: meetLink,
      calendar_link: eventLink,
      start_time,
      end_time,
      duration_minutes: Math.round((eventEndTime.getTime() - eventStartTime.getTime()) / (1000 * 60)),
      mentor_email,
      mentee_email
    };
  } catch (error) {
    console.error('❌ Error in generateMeetLink:', error);
    throw error;
  }
} 
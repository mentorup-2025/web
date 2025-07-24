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
  if (!credentialsJsonStr) throw new Error('Google credentials not configured');
  const credentials = JSON.parse(credentialsJsonStr);

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/calendar']
  );
  await auth.authorize();

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
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID, 
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

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
} 
import { respJson, respErr } from '@/lib/resp';
import { Meet } from '@/types/meet';
const { google } = require('googleapis');
const { v4: uuid } = require('uuid');

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

    // Validate time format (ISO 8601)
    const eventStartTime = new Date(start_time);
    const eventEndTime = new Date(end_time);

    if (isNaN(eventStartTime.getTime()) || isNaN(eventEndTime.getTime())) {
      return respErr('Invalid time format. Please use ISO 8601 format (e.g., 2025-03-21T14:00:00Z)');
    }

    // Validate that end time is after start time
    if (eventEndTime <= eventStartTime) {
      return respErr('End time must be after start time');
    }

    // 1. AUTHENTICATION
    const credentialsJsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJsonStr) {
      return respErr('Google credentials not configured');
    }
    const credentials = JSON.parse(credentialsJsonStr);
    console.log('Credentials check:', {
      hasClientEmail: !!credentials.client_email,
      hasPrivateKey: !!credentials.private_key,
      hasProjectId: !!credentials.project_id,
      clientEmail: credentials.client_email?.substring(0, 30) + '...',
      privateKeyLength: credentials.private_key?.length || 0,
      privateKeyStartsWith: credentials.private_key?.substring(0, 30) || 'N/A',
      privateKeyEndsWith: credentials.private_key?.substring(-30) || 'N/A'
    });

    const auth = new google.auth.JWT({
      email: credentials.client_email,  // Correct key is 'email'
      key: credentials.private_key,      // Correct key is 'key'
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: process.env.GOOGLE_ADMIN_EMAIL
    });

    // Ensure authentication is completed before making API calls
    try {
      await auth.authorize();
      console.log('✅ Google authentication successful');
    } catch (authError) {
      console.error('❌ Google authentication failed:', authError);
      return respErr('Google authentication failed - check service account credentials');
    }

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
      // New settings for a public, non-modifiable event
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
    // Using 'primary' creates the event on the service account's own calendar
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID, 
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send email invitations to all attendees
    });

    // 5. GET THE LINK
    const meetLink = response.data.hangoutLink;
    const eventLink = response.data.htmlLink; // Link to the public calendar event

    console.log('Event created successfully on the service account calendar!');
    console.log('Google Meet Link:', meetLink);
    console.log('Share this link for users to add to their calendar:', eventLink);
    console.log('Attendees added:', event.attendees);
    console.log('Event ID:', response.data.id);

    // Create Meet object
    const meet: Meet = {
      meeting_link: meetLink,
      calendar_link: eventLink,
      start_time: start_time,
      end_time: end_time,
      duration_minutes: Math.round((eventEndTime.getTime() - eventStartTime.getTime()) / (1000 * 60)),
      mentor_email: mentor_email,
      mentee_email: mentee_email
    };

    return respJson(0, 'Google Meet link generated successfully', meet);

  } catch (error) {
    console.error('Error creating Google Meet link:', error);
    return respErr('Failed to generate Google Meet link');
  }
}
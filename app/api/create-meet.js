import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
  }

  const event = {
    summary: 'Generated Google Meet',
    start: { dateTime: new Date().toISOString() },
    end: { dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() }, // +30 mins
    conferenceData: {
      createRequest: {
        requestId: 'meet-' + Date.now(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: 500 });
  }

  const eventData = await response.json();
  const meetLink = eventData.conferenceData?.entryPoints?.[0]?.uri;

  return NextResponse.json({ meetLink });
}
import { sendEmail } from '@/lib/email';
import { SendEmailProps } from '@/types/email';
import { respErr, respOk } from '@/lib/resp';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as SendEmailProps;

    // Validate required fields
    if (!body.from || !body.to ||  !body.message || !body.type) {
      return respErr('Missing required fields: from, to, subject, type, message');
    }

    // Validate email formats
    if (!body.from.includes('@') || !body.to.includes('@')) {
      return respErr('Invalid email address format');
    }

    await sendEmail(
      body.from, 
      body.to, 
      body.type,
      body.message
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to send email:', error);
    return respErr('Failed to send email');
  }
}

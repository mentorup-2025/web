import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Buffer } from 'node:buffer'; // 👈 必须引入
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { getAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';

export const runtime = 'nodejs'; // 👈 必须显式指定 nodejs 环境

// Configure route segment config
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  const signature = headers().get('stripe-signature')!;
  const rawBody = await request.text();
  const bodyBuffer = Buffer.from(rawBody, 'utf-8');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('❌ Invalid Stripe signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('📥 Stripe Event received:', event.type);


  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;
      const customerEmail = session.customer_email;

      if (!appointmentId) {
        console.error('❌ Missing appointmentId in metadata');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }


      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appointment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment_id: appointmentId,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.code == -1) {
          console.error('❌ Appointment confirmation failed:', result);
          return NextResponse.json({ error: 'Appointment confirmation failed' }, { status: 500 });
        }

        console.log(`✅ Appointment ${appointmentId} confirmed via API`);
      } catch (error) {
        console.error('❌ Failed to call appointment confirmation API:', error);
        return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
      }

      const appointment = await getAppointment(appointmentId);


      // ✅ 发邮件
      if (customerEmail && appointment) {
        const user = await getUser(appointment.mentee_id);
        const mentor = await getUser(appointment.mentor_id);
        try {
          const emailResult = await sendEmail(
            'MentorUP <no-reply@mentorup.com>',
            customerEmail,
            EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION,
            {
              userName: user?.username,
              serviceName: appointment.service_type,
              price: appointment.price,
              mentorName: mentor?.username,
              appointmentStartTime: appointment.start_time,
              appointmentEndTime: appointment.end_time
            }
          );
          console.log('📧 Email sent:', emailResult);
        } catch (emailError) {
          console.error('⚠️ Email failed:', emailError);
        }
      } else {
        console.log('ℹ️ No email in metadata');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Webhook handler failed:', error.message);
      console.error(error.stack);
    } else {
      console.error('❌ Unknown error:', error);
    }
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Buffer } from 'node:buffer';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { getAppointment } from '@/lib/appointment';
import { getUser } from '@/lib/user';
import { ConfirmAppointmentPaidHelper } from '@/lib/confirm_appointment_paid';
import { cancelAppointmentPayment } from '@/lib/appointment';

export const runtime = 'nodejs';

// Configure route segment config
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found in headers');
    return NextResponse.json({ error: 'No signature found' }, { status: 400 });
  }

  try {
    // Get the raw body as a buffer
    const rawBody = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);

    console.log('📝 Raw body length:', bodyBuffer.length);
    console.log('🔑 Signature:', signature);

    const event = stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('📥 Stripe Event received:', event.type);

    // Handle Stripe Checkout Session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;

      console.log('✅ Checkout session completed:', {
        sessionId: session.id,
        appointmentId: appointmentId,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
      });

      if (!appointmentId) {
        console.error('❌ Missing appointmentId in session metadata');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }

      // Only confirm appointment if payment was successful
      if (session.payment_status === 'paid') {
        try {
          console.log(`💰 Confirming appointment ${appointmentId} as paid`);
          await ConfirmAppointmentPaidHelper.confirmAppointmentPaid(appointmentId);
          console.log(`✅ Appointment ${appointmentId} successfully confirmed as paid`);
        } catch (error) {
          console.error(`❌ Failed to confirm appointment ${appointmentId}:`, error);
          return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
        }
      } else {
        console.log(`⚠️ Session ${session.id} completed but payment status is: ${session.payment_status}`);
      }
    }

    // Handle Stripe Checkout Session expired or canceled
    if (event.type === 'checkout.session.expired' || 
        event.type === 'checkout.session.async_payment_failed') {
      
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;

      console.log(`❌ Checkout session ${event.type}:`, {
        sessionId: session.id,
        appointmentId: appointmentId,
        paymentStatus: session.payment_status,
      });

      if (!appointmentId) {
        console.error('❌ Missing appointmentId in session metadata for failed/expired session');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }

      try {
        console.log(`🗑️ Canceling appointment ${appointmentId} due to checkout event: ${event.type}`);
        await cancelAppointmentPayment(appointmentId);
        console.log(`✅ Appointment ${appointmentId} successfully canceled and deleted`);
      } catch (error) {
        console.error(`❌ Failed to cancel appointment ${appointmentId}:`, error);
        return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    if (err.type === 'StripeSignatureVerificationError') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

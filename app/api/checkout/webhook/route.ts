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

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = paymentIntent.metadata?.appointmentId;

      if (!appointmentId) {
        console.error('Missing appointmentId in metadata');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }

      try {
        await ConfirmAppointmentPaidHelper.confirmAppointmentPaid(appointmentId);
      } catch (error) {
        console.error(' Failed to  confirm appointment:', error);
        return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
      } 
    }

    // Handle payment failures, cancellations, and requires_action
    if (event.type === 'payment_intent.payment_failed' || 
        event.type === 'payment_intent.canceled') {
      
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = paymentIntent.metadata?.appointmentId;

      if (!appointmentId) {
        console.error('Missing appointmentId in metadata for failed/canceled payment');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }

      try {
        console.log(`🗑️ Canceling appointment ${appointmentId} due to payment event: ${event.type}`);
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

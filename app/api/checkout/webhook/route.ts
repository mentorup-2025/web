import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPaymentConfirmationEmail } from '@/app/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! || "");

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('Webhook received:', event);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('this is the customer details', session.customer_details);
        
        const customerEmail = session.customer_email || session.customer_details?.email;
        const appointmentId = session.metadata?.appointmentId;

        if (!appointmentId) {
          console.error('Missing appointmentId in session metadata');
          return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
        }

        // Confirm appointment
        try {
          const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/appointment/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointment_id: appointmentId,
              hold_id: session.payment_intent
            })
          });

          if (!confirmResponse.ok) {
            console.error('Failed to confirm appointment:', await confirmResponse.text());
            return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
          }
        } catch (confirmError) {
          console.error('Error confirming appointment:', confirmError);
          return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
        }
        
        // Send confirmation email
        if (customerEmail) {
          try {
            const emailResult = await sendPaymentConfirmationEmail(
              customerEmail,
              session.amount_total || 0,
              session.id
            );
            console.log('Confirmation email sent successfully:', emailResult);
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't throw here to ensure webhook still returns 200
          }
        } else {
          console.log('No customer email found in session:', session.id);
        }
        break;
      
      // Add other event types as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, need raw body for webhook signature verification
  },
}; 
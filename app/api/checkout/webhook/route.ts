import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';

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
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail) {
          try {
            await sendEmail(
              'appointments@mentorup.com',
              customerEmail,
              'Payment Confirmation - MentorUp',
              EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION,
              {
                userName: session.customer_details?.name || 'Valued Customer',
                serviceName: "Mentorship Session",
                price: session.amount_total! / 100,
                mentorName: "Your Mentor",
                appointmentDate: "2024-03-20",
                appointmentTime: "14:00"
              }
            );
            console.log('Confirmation email sent successfully to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
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

// export const config = {
//   api: {
//     bodyParser: false, // Disable body parsing, need raw body for webhook signature verification
//   },
// }; 
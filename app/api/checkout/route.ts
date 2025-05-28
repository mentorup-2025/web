import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'usd', appointmentId, email } = await req.json(); // ✅ 加上 email

    if (!amount || !appointmentId || !email) {
      return NextResponse.json({ error: 'Missing amount, appointmentId or email' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: 'Mentorship Session',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        appointmentId, // ✅ 保留
        email,         // ✅ 新增
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
  }
}

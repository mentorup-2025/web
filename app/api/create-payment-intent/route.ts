import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
    const { amount, appointmentId } = await req.json();

    if (!amount || !appointmentId) {
        return NextResponse.json({ error: 'Missing amount or appointmentId' }, { status: 400 });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                appointmentId, // 👈 加上这一行
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
    }
}

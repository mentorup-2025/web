import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
    const { amount, appointmentId, couponId, menteeUserId } = await req.json();

    console.log('📥 Creating Stripe Checkout Session with:', { amount, appointmentId, couponId, menteeUserId });

    if (!amount || !appointmentId) {
        console.error('❌ Missing required fields:', { amount, appointmentId, menteeUserId });
        return NextResponse.json({ error: 'Missing amount or appointmentId' }, { status: 400 });
    }

    try {
        // Create Stripe Checkout Session
        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Mentoring Session',
                            description: `Appointment ID: ${appointmentId}`,
                        },
                        unit_amount: amount, // amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            allow_promotion_codes: true,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 5 minutes from now
            success_url: `https://www.mentorup.info/mentee-profile/${menteeUserId}`,
            cancel_url: `https://www.mentorup.info/mentee-profile/${menteeUserId}`,
            metadata: {
                appointmentId,
            },
        };

        // Add coupon if provided
        if (couponId) {
            sessionConfig.discounts = [
                {
                    coupon: couponId,
                },
            ];
            console.log('🎫 Applying coupon:', couponId);
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('✅ Stripe Checkout Session created:', {
            id: session.id,
            status: session.status,
            url: session.url?.slice(0, 50) + '...',
            couponApplied: !!couponId,
        });

        // Return the session URL for frontend redirect
        return NextResponse.json({
            sessionId: session.id,
            sessionUrl: session.url,
        });
    } catch (err) {
        console.error('❌ Stripe Checkout Session creation failed:', err);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}

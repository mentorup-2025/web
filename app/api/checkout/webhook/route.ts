import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  } catch (err: any) {
    console.error('❌ Invalid Stripe signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('📥 Stripe Event:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const appointmentId = paymentIntent.metadata?.appointmentId;

    console.log('📌 appointmentId:', appointmentId);

    if (!appointmentId) {
      console.error('❌ Missing appointmentId in metadata');
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const { error, data } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
          expires_at: null // ✅ 清空，表示已支付，不再取消
        })
        .eq('id', appointmentId)
        .select();  // 👈 加上 .select() 以查看被更新了哪些行

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Supabase update returned no rows. appointmentId may be wrong.');
    } else {
      console.log(`✅ Appointment ${appointmentId} status updated to confirmed`);
    }
  }

  return NextResponse.json({ received: true });
}

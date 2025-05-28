import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Buffer } from 'node:buffer'; // 👈 必须引入
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';

export const runtime = 'nodejs'; // 👈 必须显式指定 nodejs 环境

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 关闭默认 body 解析（此处对 App Router 实际无效，但保留无妨）
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = paymentIntent.metadata?.appointmentId;
      const customerEmail = paymentIntent.metadata?.email;

      if (!appointmentId) {
        console.error('❌ Missing appointmentId in metadata');
        return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
      }

      // ✅ 更新数据库记录
      const { error, data } = await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString(),
            expires_at: null,
          })
          .eq('id', appointmentId)
          .select();

      if (error) {
        console.error('❌ Supabase update error:', error.message);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Appointment not found for ID:', appointmentId);
      } else {
        console.log(`✅ Appointment ${appointmentId} confirmed`);
      }

      // ✅ 发邮件
      if (customerEmail) {
        try {
          const emailResult = await sendEmail(
              'MentorUP <no-reply@mentorup.com>',
              customerEmail,
              EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION,
              {
                amount: paymentIntent.amount_received,
                stripeId: paymentIntent.id,
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

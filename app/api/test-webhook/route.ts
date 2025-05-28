import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const rawBody = await req.text();
    console.log('✅ Webhook received with body:', rawBody);

    return NextResponse.json({ received: true });
}

// app/api/mentor/update/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateMentor } from '@/lib/mentor';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    // 校验登录用户
    const { userId } = await auth();
    if (!userId || userId !== params.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    try {
        const mentor = await updateMentor(userId, body);
        return NextResponse.json({ message: 'Updated successfully', data: mentor });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to update mentor' }, { status: 500 });
    }
}
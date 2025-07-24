// app/api/appointment/report_issue/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { respData, respErr } from '@/lib/resp';

export async function POST(request: NextRequest) {
    try {
        // 1. Auth
        const { userId } = await auth();
        if (!userId) {
            return respErr('Unauthorized: User not authenticated');
        }

        // 2. Parse payload (support both keys)
        const { appointmentId, reportReason, issueDescription } = await request.json();
        const text = reportReason ?? issueDescription;
        if (!appointmentId || !text) {
            return respErr('Missing required fields: appointmentId or reportReason/issueDescription');
        }

        // 3. Send to your inbox
        await sendEmail(
            'MentorUP <contactus@mentorup.info>',
            'contactus@mentorup.info',               // ← your inbox
            EmailTemplate.SESSION_REPORT_ISSUE,
            {
                appointmentId,
                reportReason: text,               // this will land in your email component’s props
            }
        );

        return respData({ success: true });
    } catch (err: any) {
        console.error('Error in report_issue:', err);
        return respErr('Failed to send report: ' + err.message);
    }
}
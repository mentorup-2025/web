// app/api/appointment/report_issue/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { respData, respErr } from '@/lib/resp';
import { getUser } from '@/lib/user';

export async function POST(request: NextRequest) {
    try {
        // 1. Auth
        const { userId } = await auth();
        if (!userId) {
            return respErr('Unauthorized: User not authenticated');
        }

        // 2. Parse payload (支持两种 key)
        const { appointmentId, reportReason, issueDescription } = await request.json();
        const text = reportReason ?? issueDescription;
        if (!appointmentId || !text) {
            return respErr('Missing required fields: appointmentId or reportReason/issueDescription');
        }

        // 3. 发送给 support inbox（原始 issue 报告）
        await sendEmail(
            'MentorUP <contactus@mentorup.info>',
            'contactus@mentorup.info',
            EmailTemplate.SESSION_REPORT_ISSUE,
            {
                appointmentId,
                reportReason: text,
                reporterId: userId,
            }
        );

        // 4. 给 reporter（当前登录用户）发一封确认收到的 receipt email
        try {
            const reporter = await getUser(userId);
            let reporterEmail: string | undefined;
            let reporterName = 'there';

            if (reporter) {
                if (reporter.email) {
                    reporterEmail = reporter.email;
                }
                if (reporter.username) {
                    reporterName = reporter.username;
                }
            }

            if (!reporterEmail) {
                console.warn('Reporter user has no email, skipping receipt email.');
            } else {
                await sendEmail(
                    'MentorUP <contactus@mentorup.info>',
                    reporterEmail,
                    EmailTemplate.SESSION_REPORT_ISSUE_RECEIPT, // 确保在 enum 里有这个模板
                    {
                        recipientName: reporterName,
                        appointmentId,
                        issueDescription: text,
                    }
                );
                console.log('✅ 已发送 receipt email 给 reporter:', reporterEmail);
            }
        } catch (receiptErr: any) {
            console.error('Failed to send receipt email to reporter:', receiptErr);
            // 不阻塞主流程
        }

        return respData({ success: true });
    } catch (err: any) {
        console.error('Error in report_issue:', err);
        return respErr('Failed to send report: ' + (err?.message || 'unknown error'));
    }
}
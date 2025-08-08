// components/SessionReportIssueReceiptEmail.tsx
import React from 'react';

interface SessionReportIssueReceiptProps {
    recipientName: string;       // 举报人名字
    reportReason: string;        // 他们提交的 issue 描述
}

const SessionReportIssueReceiptEmail: React.FC<SessionReportIssueReceiptProps> = ({
                                                                                      recipientName,
                                                                                      reportReason,
                                                                                  }) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: 1.5, color: '#1f2937' }}>
        <h1 style={{ fontSize: '1.5em' }}>Your Issue Has Been Received – We're Working on It</h1>

        <p>Hi {recipientName || 'there'},</p>

        <p>
            Thank you for bringing this to our attention. We’ve received your report and our team is currently reviewing it.
        </p>

        <p>
            We’re committed to addressing your issue with care and will follow up within 1–2 business days.
        </p>

        <p>
            <strong>Issue Reported:</strong><br />
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {reportReason}
            </div>
        </p>

        <p>
            If you have any additional information, feel free to reply to this email.
        </p>

        <p>
            We appreciate your patience and understanding.
        </p>

        <p>Best regards,<br />The MentorUp Team</p>
    </div>
);

export default SessionReportIssueReceiptEmail;
export type { SessionReportIssueReceiptProps };
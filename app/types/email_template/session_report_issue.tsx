// components/SessionReportIssueEmail.tsx
import React from 'react';

interface SessionReportIssueProps {
    recipientName: string;      // e.g. Mentor’s name
    appointmentId: string;
    sessionDate: string;        // e.g. "2025-07-30"
    sessionTime: string;        // e.g. "08:00 AM"
    reportReason: string;   // what the mentee reported
    reporterName: string;       // the mentee’s name
}

const SessionReportIssueEmail: React.FC<SessionReportIssueProps> = ({
                                                      recipientName,
                                                      appointmentId,
                                                      sessionDate,
                                                      sessionTime, reportReason,
                                                      reporterName,
                                                  }) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: 1.5 }}>
        <h1>New Issue Reported</h1>

        <p>Hi {recipientName},</p>

        <p>
            Your mentee <strong>{reporterName}</strong> has reported an issue for the session scheduled on{' '}
            <strong>{sessionDate} at {sessionTime}</strong> (Appointment ID: <em>{appointmentId}</em>).
        </p>

        <p>
            <strong>Issue Details:</strong><br />
            {reportReason}
        </p>

        <p>
            Please follow up with them to address their concerns. If you need further assistance, reply to this email or reach out to support at{' '}
            <a href="mailto:contactus@mentorup.info">contactus@mentorup.info</a>.
        </p>

        <p>
            You can view and manage your appointments by visiting{' '}
            <a href="https://www.mentorup.info">https://www.mentorup.info</a>
        </p>

        <p>Thank you for being a part of MentorUp!</p>

        <p>Cheers,<br />The MentorUp Team</p>
    </div>
);

export default SessionReportIssueEmail;
export type { SessionReportIssueProps };
import React from 'react';

interface Props {
    recipientName: string;
    mentorName: string;
}

const MentorAppointmentDeclinedEmail: React.FC<Props> = ({
                                                             recipientName,
                                                             mentorName
                                                         }) => (
    <div style={{ fontFamily: 'sans-serif' }}>
        <h1>Session Time Declined</h1>
        <p>Hi {recipientName},</p>
        <p>
            Unfortunately, {mentorName} has declined the proposed time. Please log in
            to suggest a new slot that works for both of you.
        </p>
        <p>Thank you for your flexibility.</p>
        <p>— MentorUp Team</p>
    </div>
);

export default MentorAppointmentDeclinedEmail;
import React from 'react';

interface Props {
    recipientName: string;
    mentorName: string;
    confirmedDate: string;
    confirmedTime: string;
}

const MentorAppointmentAcceptedEmail: React.FC<Props> = ({
                                                             recipientName,
                                                             mentorName,
                                                             confirmedDate,
                                                             confirmedTime,
                                                         }) => (
    <div style={{ fontFamily: 'sans-serif' }}>
        <h1>Session Confirmed!</h1>
        <p>Hi {recipientName},</p>
        <p>
            Great news—{mentorName} has confirmed your session for
            <strong> {confirmedDate} at {confirmedTime}</strong>.
        </p>
        <p>We look forward to seeing you then!</p>
        <p>Cheers,<br/>The MentorUp Team</p>
    </div>
);

export default MentorAppointmentAcceptedEmail;
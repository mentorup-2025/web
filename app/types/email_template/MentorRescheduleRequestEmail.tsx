import React from 'react';

interface Props {
    recipientName: string;
    mentorName: string;
    originalDate: string;
    originalTime: string;
    appointmentLink: string;
}

const MentorRescheduleRequestEmail: React.FC<Props> = ({
                                                           recipientName,
                                                           mentorName,
                                                           originalDate,
                                                           originalTime,
                                                           appointmentLink
                                                       }) => (
    <div style={{ fontFamily: 'sans-serif' }}>
        <h1>Your mentor wants to reschedule</h1>
        <p>Hi {recipientName},</p>
        <p>
            {mentorName} has requested to reschedule your session originally set for
            <strong> {originalDate} at {originalTime}</strong>.
        </p>
        <p>
            Please <a href={appointmentLink}>click here</a> to choose a new time that works for you.
        </p>
        <p>Thanks,<br/>The MentorUp Team</p>
    </div>
);

export default MentorRescheduleRequestEmail;
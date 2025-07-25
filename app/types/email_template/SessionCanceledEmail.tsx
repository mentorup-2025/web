// components/SessionCanceledEmail.tsx
import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Text,
    Link,
    Preview,
    Section,
    Hr
} from '@react-email/components';

export interface SessionCanceledProps {
    recipientName: string;   // 收件人名字（mentee 或 mentor）
    mentorName: string;      // mentor 的名字
    appointmentId: string;
    sessionDate: string;     // e.g. "2025-08-01"
    sessionTime: string;     // e.g. "2:00 PM"
    cancelReason?: string;   // 可选
    isMentee?: boolean;      // 标记收件人是否是 mentee
}

const SessionCanceledEmail: React.FC<SessionCanceledProps> = ({
                                                                  recipientName,
                                                                  mentorName,
                                                                  appointmentId,
                                                                  sessionDate,
                                                                  sessionTime,
                                                                  cancelReason,
                                                                  isMentee = false,
                                                              }) => (
    <Html>
        <Head />
        <Preview>We’re Sorry – Your Session Has Been Canceled</Preview>
        <Body style={main}>
            <Container style={container}>
                <Text style={h1}>We’re Sorry – Your Session Has Been Canceled</Text>

                <Text style={text}>
                    Hi {recipientName},
                </Text>

                <Text style={text}>
                    We’re sorry to inform you that your session with <strong>{mentorName}</strong>
                    (Appointment ID: <em>{appointmentId}</em>) scheduled on{' '}
                    <strong>{sessionDate} at {sessionTime}</strong> has been <strong>canceled</strong>.
                </Text>

                {cancelReason && (
                    <Section style={boxContainer}>
                        <Text style={h2}>Reason Provided:</Text>
                        <Text style={text}>{cancelReason}</Text>
                    </Section>
                )}

                {/* 只有 mentee 收件人才能看到退款说明 */}
                {isMentee && (
                    <Text style={text}>
                        We will process your refund within 3–5 business days. If you have any questions,
                        feel free to reply to this email or contact{' '}
                        <Link
                            href="mailto:contactus@mentorup.info"
                            style={{ fontWeight: 'bold', color: '#1890FF' }}
                        >
                            contactus@mentorup.info
                        </Link>.
                    </Text>
                )}

                <Text style={text}>
                    You can view and manage your appointments anytime at{' '}
                    <Link href="https://www.mentorup.info">www.mentorup.info</Link>.
                </Text>

                <Hr style={hr} />

                <Text style={footer}>
                    Best regards,<br />The MentorUp Team
                </Text>
            </Container>
        </Body>
    </Html>
);

export default SessionCanceledEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────
const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '600px'
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px'
};

const h2 = {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px'
};

const text = {
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px'
};

const boxContainer = {
    padding: '16px',
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    marginBottom: '16px'
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0'
};

const footer = {
    fontSize: '14px',
    color: '#666666'
};
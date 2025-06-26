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
    Hr,
} from '@react-email/components';

interface RefundProcessedProps {
    userName: string;
    refundAmount: string;
    sessionTitle?: string;
}

const RefundProcessedEmail: React.FC<RefundProcessedProps> = ({
                                                                  userName,
                                                                  refundAmount,
                                                                  sessionTitle,
                                                              }) => {
    return (
        <Html>
            <Head />
            <Preview>Your refund has been processed by MentorUp</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={h1}>Refund Confirmation</Text>
                    <Text style={text}>Dear {userName},</Text>

                    <Text style={text}>
                        We’ve successfully processed your refund of <strong>{refundAmount}</strong>
                        {sessionTitle ? ` for the session titled "${sessionTitle}"` : ''}. The refund has been issued to your original payment method and should appear on your statement within 5–10 business days.
                    </Text>

                    <Section style={boxContainer}>
                        <Text style={h2}>What’s next?</Text>
                        <Text style={detailLine}>• Check your bank or payment provider for the refund entry</Text>
                        <Text style={detailLine}>• If you have not received your refund after 10 business days, please contact your payment provider first</Text>
                        <Text style={detailLine}>• You can also reach out to our support team any time</Text>
                    </Section>

                    <Text style={text}>
                        If you have any concerns or questions, feel free to contact us at{' '}
                        <Link href="mailto:support@mentorup.com">support@mentorup.com</Link>.
                        We're here to help!
                    </Text>

                    <Hr style={hr} />

                    <Text style={footer}>
                        Best regards,<br />
                        The MentorUp Team
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles (same as original)
const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '600px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
};

const h2 = {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 16px',
};

const text = {
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
};

const boxContainer = {
    padding: '24px',
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    marginBottom: '24px',
};

const detailLine = {
    margin: '8px 0',
    fontSize: '14px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    fontSize: '14px',
    color: '#666666',
    marginTop: '16px',
};

export default RefundProcessedEmail;
export type { RefundProcessedProps };

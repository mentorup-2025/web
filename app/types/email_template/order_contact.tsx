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

interface OrderContactEmailProps {
    userName: string;
    orderId?: string;
    appointmentDate?: string;
}

const OrderContactEmail: React.FC<OrderContactEmailProps> = ({
                                                                 userName,
                                                                 orderId,
                                                                 appointmentDate,
                                                             }) => {
    return (
        <Html>
            <Head />
            <Preview>We’ve received your request regarding your MentorUp appointment</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={h1}>We've received your message</Text>
                    <Text style={text}>Dear {userName},</Text>

                    <Text style={text}>
                        Thank you for reaching out to us regarding your order
                        {orderId ? ` <strong>#${orderId}</strong>` : ''}.
                        {appointmentDate
                            ? ` Your appointment scheduled for <strong>${appointmentDate}</strong> has been noted.`
                            : ''}
                    </Text>

                    <Section style={boxContainer}>
                        <Text style={h2}>Next Steps:</Text>
                        <Text style={detailLine}>• Our support team will review your inquiry shortly</Text>
                        <Text style={detailLine}>• You can expect a response within 24 hours</Text>
                        <Text style={detailLine}>• If any action is required on your end, we’ll let you know</Text>
                    </Section>

                    <Text style={text}>
                        If you have additional details to share or need urgent assistance, feel free to reply
                        to this email or contact us directly at{' '}
                        <Link href="mailto:contactus@mentorup.info">contactus@mentorup.info</Link>.
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

// Styles
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

export default OrderContactEmail;
export type { OrderContactEmailProps };

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

interface PaymentConfirmationProps {
  userName: string;
  serviceName: string;
  price: number;
  mentorName: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
}

const MenteeApptConfirmationEmail: React.FC<PaymentConfirmationProps> = ({
  userName,
  serviceName,
  price,
  mentorName,
  appointmentStartTime,
  appointmentEndTime
}) => {
  // Format the date and time
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    });
  };

  return (
    <Html>
      <Head />
      <Preview>Payment Confirmation - {serviceName} with {mentorName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>Payment Confirmation</Text>
          <Text style={text}>Dear {userName},</Text>
          
          <Text style={text}>Thank you for your payment. Your booking has been confirmed.</Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Booking Details:</Text>
            <Text style={detailLine}><strong>Service:</strong> {serviceName}</Text>
            <Text style={detailLine}><strong>Mentor:</strong> {mentorName}</Text>
            <Text style={detailLine}><strong>Start Time:</strong> {formatDateTime(appointmentStartTime)}</Text>
            <Text style={detailLine}><strong>End Time:</strong> {formatDateTime(appointmentEndTime)}</Text>
            <Text style={detailLine}><strong>Amount Paid:</strong> ${price.toFixed(2)}</Text>
          </Section>

          <Text style={text}>
            Your session will be conducted online. You'll receive a separate email with 
            the meeting link and any preparation instructions from your mentor.
          </Text>

          <Text style={text}>
            If you need to reschedule or have any questions, please contact us at{' '}
            <Link href="mailto:support@mentorup.com">support@mentorup.com</Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,<br />The MentorUp Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
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

export default MenteeApptConfirmationEmail; 
export type { PaymentConfirmationProps };
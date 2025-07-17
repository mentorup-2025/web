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

interface ApptConfirmationProps {
  recipientName: string;
  mentorName: string;
  menteeName: string;
  serviceName: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
}

const ApptConfirmationEmail: React.FC<ApptConfirmationProps> = ({
  recipientName,
  mentorName,
  menteeName,
  serviceName,
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
      <Preview>Congratulations! Your appointment has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>🎉 Appointment Confirmed!</Text>
          <Text style={text}>Dear {recipientName},</Text>
          
          <Text style={text}>
            Congratulations! Your appointment has been confirmed. We're excited to facilitate this mentorship session.
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Appointment Details:</Text>
            <Text style={detailLine}><strong>Mentor:</strong> {mentorName}</Text>
            <Text style={detailLine}><strong>Mentee:</strong> {menteeName}</Text>
            <Text style={detailLine}><strong>Service:</strong> {serviceName}</Text>
            <Text style={detailLine}><strong>Start Time:</strong> {formatDateTime(appointmentStartTime)}</Text>
            <Text style={detailLine}><strong>End Time:</strong> {formatDateTime(appointmentEndTime)}</Text>
          </Section>

          <Text style={text}>
            Please prepare for your session and ensure you have all necessary materials ready. 
            You'll receive a meeting link shortly before the session begins.
          </Text>

          <Text style={text}>
            You can view and manage your appointments by visiting{' '}
            <Link href="https://www.mentorup.info">www.mentorup.info</Link>
          </Text>

          <Text style={text}>
            If you have any questions or need assistance, please contact us at{' '}
            <Link href="mailto:contactus@mentorup.info">contactus@mentorup.info</Link>
          </Text>

          <Text style={text}>
            Thank you for being part of our mentorship community!
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

export default ApptConfirmationEmail;
export type { ApptConfirmationProps }; 
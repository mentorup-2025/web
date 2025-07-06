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

interface MentorApptRequestProps {
  mentorName: string;
  serviceName: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  appointmentId: string;
}

const MentorApptRequestEmail: React.FC<MentorApptRequestProps> = ({
  mentorName,
  serviceName,
  appointmentStartTime,
  appointmentEndTime,
  appointmentId
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
      <Preview>[Action Required] Appointment Request - A mentee has scheduled a session with you</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>[Action Required] Appointment Request</Text>
          <Text style={text}>Dear {mentorName},</Text>
          
          <Text style={text}>
            A mentee has scheduled an appointment with you and is awaiting your confirmation. Please review the details below and confirm as soon as possible.
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Appointment Details:</Text>
            <Text style={detailLine}><strong>Service:</strong> {serviceName}</Text>
            <Text style={detailLine}><strong>Start Time:</strong> {formatDateTime(appointmentStartTime)}</Text>
            <Text style={detailLine}><strong>End Time:</strong> {formatDateTime(appointmentEndTime)}</Text>
            <Text style={detailLine}><strong>Appointment ID:</strong> {appointmentId}</Text>
          </Section>

          <Text style={text}>
            <strong>Action Required:</strong> Please confirm this appointment as soon as possible. 
            If the proposed time does not work for you, please propose alternative times in the "My Sessions" section on our website.
          </Text>

          <Text style={text}>
            You can manage your appointments and propose alternative times by visiting the "My Sessions" section at{' '}
            <Link href="https://www.mentorup.info">www.mentorup.info</Link>
          </Text>

          <Text style={text}>
            If you have any questions or need assistance, please contact us at{' '}
            <Link href="mailto:contactus@mentorup.com">contactus@mentorup.com</Link>
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

export default MentorApptRequestEmail;
export type { MentorApptRequestProps }; 
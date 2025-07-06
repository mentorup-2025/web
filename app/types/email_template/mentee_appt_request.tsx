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

interface MenteeApptRequestProps {
  userName: string;
  serviceName: string;
  mentorName: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
}

const MenteeApptRequestEmail: React.FC<MenteeApptRequestProps> = ({
  userName,
  serviceName,
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
      <Preview>Appointment Request - {serviceName} with {mentorName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>Appointment Request</Text>
          <Text style={text}>Dear {userName},</Text>
          
          <Text style={text}>
            You have successfully made a request to schedule an appointment with {mentorName}.
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Request Details:</Text>
            <Text style={detailLine}><strong>Service:</strong> {serviceName}</Text>
            <Text style={detailLine}><strong>Mentor:</strong> {mentorName}</Text>
            <Text style={detailLine}><strong>Requested Time:</strong> {formatDateTime(appointmentStartTime)} - {formatDateTime(appointmentEndTime)}</Text>
          </Section>

          <Text style={text}>
            We will send you an email once the mentor has confirmed your appointment. 
            Please check your inbox for updates.
          </Text>

          <Text style={text}>
            If you have any questions, please contact us at{' '}
            <Link href="mailto:contactus@mentorup.com">contactus@mentorup.com</Link>
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

export default MenteeApptRequestEmail;
export type { MenteeApptRequestProps }; 
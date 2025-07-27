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
import { convertUTCToPDT } from '@/lib/utc_to_pdt';

interface RescheduleProposalReceivedProps {
  receiverName: string;
  proposerName: string;
  appointmentId: string;
  originalStartTime: string;
  originalEndTime: string;
  proposedTimeRanges: Array<[string, string]>;
}

const RescheduleProposalReceivedEmail: React.FC<RescheduleProposalReceivedProps> = ({
  receiverName,
  proposerName,
  appointmentId,
  originalStartTime,
  originalEndTime,
  proposedTimeRanges
}) => {
  // Format the date and time using UTC to PDT conversion
  const formatDateTime = (dateTimeStr: string) => {
    const pdtTimeStr = convertUTCToPDT(dateTimeStr);
    const date = new Date(pdtTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    }) + ' PDT';
  };

  const formatOriginalTime = () => {
    return `${formatDateTime(originalStartTime)} - ${formatDateTime(originalEndTime)}`;
  };

  return (
    <Html>
      <Head />
      <Preview>Reschedule Request - {proposerName} has proposed new times for your appointment</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>Reschedule Request</Text>
          <Text style={text}>Dear {receiverName},</Text>
          
          <Text style={text}>
            {proposerName} has requested to reschedule your appointment. They've proposed several alternative times that might work better.
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Original Appointment:</Text>
            <Text style={detailLine}><strong>Appointment ID:</strong> {appointmentId}</Text>
            <Text style={detailLine}><strong>Original Time:</strong> {formatOriginalTime()}</Text>
          </Section>

          <Section style={boxContainer}>
            <Text style={h2}>Proposed Alternative Times:</Text>
            {proposedTimeRanges.map((timeRange, index) => (
              <Text key={index} style={detailLine}>
                <strong>Option {index + 1}:</strong> {formatDateTime(timeRange[0])} - {formatDateTime(timeRange[1])}
              </Text>
            ))}
          </Section>

          <Text style={text}>
            Please review these proposed times and take action:
          </Text>
          
          <Text style={text}>
            <strong>Option 1:</strong> Confirm one of the proposed times if any work for you<br />
            <strong>Option 2:</strong> Propose different times that work better for your schedule<br />
          </Text>

          <Text style={text}>
            Please respond within 24 hours to ensure we can finalize the appointment details. 
            If you have any questions, please contact us at{' '}
            <Link href="mailto:contactus@mentorup.info">contactus@mentorup.info</Link>
          </Text>

          <Text style={text}>
            You can view and manage your appointments by visiting{' '}
            <Link href="https://www.mentorup.info">https://www.mentorup.info</Link>
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

export default RescheduleProposalReceivedEmail;
export type { RescheduleProposalReceivedProps }; 
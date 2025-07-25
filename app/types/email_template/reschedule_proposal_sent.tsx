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

interface RescheduleProposalSentProps {
  proposerName: string;
  receiverName: string;
  appointmentId: string;
  originalStartTime: string;
  originalEndTime: string;
  proposedTimeRanges: Array<[string, string]>;
}

const RescheduleProposalSentEmail: React.FC<RescheduleProposalSentProps> = ({
  proposerName,
  receiverName,
  appointmentId,
  originalStartTime,
  originalEndTime,
  proposedTimeRanges
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

  const formatOriginalTime = () => {
    return `${formatDateTime(originalStartTime)} - ${formatDateTime(originalEndTime)}`;
  };

  return (
    <Html>
      <Head />
      <Preview>Reschedule Proposal Sent - Waiting for {receiverName}'s confirmation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>Reschedule Proposal Sent</Text>
          <Text style={text}>Dear {proposerName},</Text>
          
          <Text style={text}>
            Your reschedule proposal has been sent to {receiverName}. We'll notify you once they respond to your proposal.
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Original Appointment:</Text>
            <Text style={detailLine}><strong>Appointment ID:</strong> {appointmentId}</Text>
            <Text style={detailLine}><strong>Original Time:</strong> {formatOriginalTime()}</Text>
          </Section>

          <Section style={boxContainer}>
            <Text style={h2}>Your Proposed Times:</Text>
            {proposedTimeRanges.map((timeRange, index) => (
              <Text key={index} style={detailLine}>
                <strong>Option {index + 1}:</strong> {formatDateTime(timeRange[0])} - {formatDateTime(timeRange[1])}
              </Text>
            ))}
          </Section>

          <Text style={text}>
            {receiverName} will review your proposed times and either:
          </Text>
          
          <Text style={text}>
            • Confirm one of your proposed times<br />
            • Propose alternative times that work better for them
          </Text>

          <Text style={text}>
            You'll receive an email notification once they respond. If you need to make any changes 
            to your proposal, please contact us at{' '}
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

export default RescheduleProposalSentEmail;
export type { RescheduleProposalSentProps }; 
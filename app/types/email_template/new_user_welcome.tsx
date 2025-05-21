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
  Button
} from '@react-email/components';

interface NewUserWelcomeProps {
  userName: string;
  userEmail: string;
}

const NewUserWelcomeEmail: React.FC<NewUserWelcomeProps> = ({
  userName,
  userEmail
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to MentorUp - Your Journey Begins Here!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={h1}>Welcome to MentorUp!</Text>
          <Text style={text}>Dear {userName},</Text>
          
          <Text style={text}>
            Thank you for joining MentorUp! We're excited to have you as part of our community 
            of learners and mentors. Your account has been successfully created with the email: {userEmail}
          </Text>
          
          <Section style={boxContainer}>
            <Text style={h2}>Getting Started:</Text>
            <Text style={detailLine}>1. Complete your profile to help us match you with the right opportunities</Text>
            <Text style={detailLine}>2. Explore our network of experienced mentors</Text>
            <Text style={detailLine}>3. Browse available mentorship sessions</Text>
            <Text style={detailLine}>4. Book your first session with a mentor</Text>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, our support team is here to help. 
            Contact us at{' '}
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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

export default NewUserWelcomeEmail;
export type { NewUserWelcomeProps }; 
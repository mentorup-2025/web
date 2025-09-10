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
  Button,
  Img,
} from '@react-email/components';

interface NewUserWelcomeProps {
  userName: string;   // 用作 Hi [First Name]
  userEmail: string;  // 如需展示可保留，不展示也没问题
}

const HERO_URL = '/images/claim.png';

const NewUserWelcomeEmail: React.FC<NewUserWelcomeProps> = ({
                                                              userName,
                                                              userEmail,
                                                            }) => {
  return (
      <Html>
        <Head />
        <Preview>Welcome to MentorUp – 20% OFF Your First Order + Free Coffee Chat 🎉</Preview>
        <Body style={main}>
          <Container style={container}>
            {/* 顶部横幅图 */}
            <Section style={{ marginBottom: 24 }}>
              <Link
                  href="https://www.mentorup.info/mentor-list"
                  target="_blank"
                  style={{ display: 'block' }}
              >
                <Img
                    src={HERO_URL}
                    width="100%"
                    alt="Welcome to MentorUp"
                    style={{ borderRadius: 10, display: 'block' }}
                />
              </Link>
            </Section>

            <Text style={h1}>
              Welcome to MentorUp – 20% OFF Your First Order + Free Coffee Chat 🎉
            </Text>

            <Text style={text}>Hi {userName || 'there'},</Text>

            <Text style={text}>
              Welcome to MentorUp! 🎉 We&apos;re thrilled to have you join our community of learners
              and mentors.
            </Text>

            {/* 优惠卡片 */}
            <Section style={promoBox}>
              <Text style={promoTitle}>✨ As a new member, you’ll get:</Text>
              <Text style={detailLine}>
                <strong>20% OFF</strong> first order with code:
              </Text>

              <Section style={codeBox}>
                <Text style={codeText}>HIMENTORUP20</Text>
              </Section>

              <Text style={detailLine}>
                And a <strong>FREE coffee chat</strong> with a mentor — available with mentors who
                opt in for Free Coffee Chats.
              </Text>
            </Section>

            {/* Getting Started */}
            <Section style={boxContainer}>
              <Text style={h2}>Getting Started:</Text>

              <Text style={li}>
                • Complete your profile at{' '}
                <Link href="https://mentorup.info" style={link}>
                  mentorup.info
                </Link>{' '}
                so we can match you with mentors
              </Text>
              <Text style={li}>• Explore our network of experienced mentors</Text>
              <Text style={li}>• Browse available mentorship sessions</Text>
              <Text style={li}>
                • Book your first session and use your <strong>20% OFF</strong> code (don’t forget to
                claim your free coffee chat!)
              </Text>

              {/* CTA 按钮（可选） */}
              <Section style={buttonRow}>
                <Button href="https://mentorup.info" style={buttonPrimary}>
                  Complete My Profile
                </Button>
                <Button href="https://www.mentorup.info/mentor-list" style={buttonSecondary}>
                  Browse Mentors
                </Button>
              </Section>
            </Section>

            <Text style={text}>
              If you have any questions, we’re here to help:{' '}
              <Link href="mailto:contactus@mentorup.info" style={link}>
                contactus@mentorup.info
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Best,
              <br />
              The MentorUp Team
            </Text>
          </Container>
        </Body>
      </Html>
  );
};

/* ===== Styles ===== */
const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const h2: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const text: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  color: '#111',
};

const link: React.CSSProperties = {
  color: '#0070f3',
  textDecoration: 'underline',
};

const boxContainer: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  marginBottom: '24px',
};

const promoBox: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#fff7e6',
  border: '1px solid #ffe7ba',
  borderRadius: 8,
  marginBottom: 24,
};

const promoTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 8px',
};

const detailLine: React.CSSProperties = {
  margin: '8px 0',
  fontSize: 14,
  lineHeight: '22px',
};

const codeBox: React.CSSProperties = {
  backgroundColor: '#111827',
  borderRadius: 6,
  padding: '10px 14px',
  display: 'inline-block',
  margin: '8px 0 4px',
};

const codeText: React.CSSProperties = {
  color: '#fff',
  fontWeight: 700,
  letterSpacing: 1,
};

const li: React.CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  margin: '6px 0',
};

const buttonRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 16,
  flexWrap: 'wrap',
};

const buttonPrimary: React.CSSProperties = {
  backgroundColor: '#0070f3',
  borderRadius: 6,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 16px',
};

const buttonSecondary: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 6,
  color: '#0070f3',
  border: '1px solid #0070f3',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 16px',
};

const hr: React.CSSProperties = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  marginTop: '16px',
};

export default NewUserWelcomeEmail;
export type { NewUserWelcomeProps };
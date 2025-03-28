import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  amount: number,
  sessionId: string
) {
  try {
    console.log('Attempting to send email with Resend...', {
      to: customerEmail,
      amount,
      sessionId
    });

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's default sending domain for testing
      to: customerEmail,
      subject: 'Payment Confirmation - MentorUp',
      html: `
        <h1>Thank you for your payment!</h1>
        <p>Your payment of $${(amount / 100).toFixed(2)} has been successfully processed.</p>
        <p>Transaction ID: ${sessionId}</p>
        <br/>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <br/>
        <p>Best regards,</p>
        <p>The MentorUp Team</p>
      `,
    });

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw to handle in webhook
  }
} 
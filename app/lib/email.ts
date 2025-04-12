import { createElement } from 'react';
import { getResendClient } from '@/services/resend';
import { EmailTemplate } from '@/types/email';
import MenteeApptConfirmationEmail, { PaymentConfirmationProps } from '@/types/email_template/mentee_appt_confirmation';

const resend = getResendClient();

const getEmailComponent = (type: EmailTemplate, data: Record<string, any>) => {
  switch (type) {
    case EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION.toString():
      return createElement(MenteeApptConfirmationEmail, data as PaymentConfirmationProps);
    default:
      throw new Error(`Unknown email template: ${type}`);
  }
};

export async function sendEmail(
  from: string,
  to: string,
  subject: string,
  type: EmailTemplate,
  message: Record<string, any>
) {
  try {
    const emailComponent = getEmailComponent(type, message);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react: emailComponent
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Error sending email:', error);
    throw error instanceof Error ? error : new Error('Unknown error sending email');
  }
}

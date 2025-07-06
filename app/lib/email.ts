import { createElement } from 'react';
import { getResendClient } from '@/services/resend';
import { EMAIL_TEMPLATE_TITLES, EmailTemplate } from '@/types/email';
import MenteeApptConfirmationEmail, { PaymentConfirmationProps } from '@/types/email_template/mentee_appt_confirmation';
import MentorApptConfirmationEmail, { MentorApptConfirmationProps } from '@/types/email_template/mentor_appt_confirmation';
import RescheduleProposalSentEmail, { RescheduleProposalSentProps } from '@/types/email_template/reschedule_proposal_sent';
import RescheduleProposalReceivedEmail, { RescheduleProposalReceivedProps } from '@/types/email_template/reschedule_proposal_received';
import NewUserWelcomeEmail, { NewUserWelcomeProps } from '@/types/email_template/new_user_welcome';
import RefundProcessedEmail, { RefundProcessedProps } from '@/types/email_template/refund_processed';
import OrderContactEmail, { OrderContactEmailProps } from '@/types/email_template/order_contact';

const resend = getResendClient();

const getEmailComponent = (type: EmailTemplate, data: Record<string, any>) => {
  switch (type) {
    case EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION.toString():
      return createElement(MenteeApptConfirmationEmail, data as PaymentConfirmationProps);
    case EmailTemplate.MENTOR_APPOINTMENT_CONFIRMATION.toString():
      return createElement(MentorApptConfirmationEmail, data as MentorApptConfirmationProps);
    case EmailTemplate.RESCHEDULE_PROPOSAL_SENT.toString():
      return createElement(RescheduleProposalSentEmail, data as RescheduleProposalSentProps);
    case EmailTemplate.RESCHEDULE_PROPOSAL_RECEIVED.toString():
      return createElement(RescheduleProposalReceivedEmail, data as RescheduleProposalReceivedProps);
    case EmailTemplate.USER_SIGN_UP_CONFIRMATION.toString():
      return createElement(NewUserWelcomeEmail, data as NewUserWelcomeProps);
    case EmailTemplate.REFUND_PROCESSED.toString():
      return createElement(RefundProcessedEmail, data as RefundProcessedProps);
    case EmailTemplate.ORDER_CONTACT.toString():
      return createElement(OrderContactEmail, data as OrderContactEmailProps);
    default:
      throw new Error(`Unknown email template: ${type}`);
  }
};

export async function sendEmail(
    from: string,
    to: string,
    type: EmailTemplate,
    message: Record<string, any>
) {
  try {
    const emailComponent = getEmailComponent(type, message);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: EMAIL_TEMPLATE_TITLES[type],
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

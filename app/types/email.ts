export enum EmailTemplate {
  MENTEE_APPOINTMENT_CONFIRMATION = 'MenteeApptConfirmationEmail',
  MENTOR_APPOINTMENT_CONFIRMATION = 'MentorApptConfirmationEmail',
  RESCHEDULE_PROPOSAL_SENT = 'RescheduleProposalSentEmail',
  RESCHEDULE_PROPOSAL_RECEIVED = 'RescheduleProposalReceivedEmail',
  USER_SIGN_UP_CONFIRMATION = 'UserSignUpConfirmationEmail',
  REFUND_PROCESSED = 'RefundProcessedEmail',
  ORDER_CONTACT = 'OrderContactEmail',
}

export interface SendEmailProps {
  from: string;
  to: string;
  type: EmailTemplate;
  message: Record<string, any>;
}

export const EMAIL_TEMPLATE_TITLES: Record<EmailTemplate, string> = {
  [EmailTemplate.USER_SIGN_UP_CONFIRMATION]: 'Welcome to MentorUp - Your Journey Begins Here!',
  [EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION]: 'Appointment Confirmation - Your Mentorship Session',
  [EmailTemplate.MENTOR_APPOINTMENT_CONFIRMATION]: 'Appointment Confirmation - New Session Scheduled',
  [EmailTemplate.RESCHEDULE_PROPOSAL_SENT]: 'Reschedule Proposal Sent - Waiting for Confirmation',
  [EmailTemplate.RESCHEDULE_PROPOSAL_RECEIVED]: '[Action Required] There is a reschedule request to your mentorup appointment',
  [EmailTemplate.REFUND_PROCESSED]: 'Your Refund from MentorUp Has Been Processed',
  [EmailTemplate.ORDER_CONTACT]: 'We\'ve Received Your Request About Your Appointment',
};

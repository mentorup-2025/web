export enum EmailTemplate {
  MENTEE_APPOINTMENT_REQUEST = 'MenteeApptRequestEmail',
  MENTOR_APPOINTMENT_REQUEST = 'MentorApptRequestEmail',
  APPOINTMENT_CONFIRMATION = 'ApptConfirmationEmail',
  RESCHEDULE_PROPOSAL_SENT = 'RescheduleProposalSentEmail',
  RESCHEDULE_PROPOSAL_RECEIVED = 'RescheduleProposalReceivedEmail',
  USER_SIGN_UP_CONFIRMATION = 'UserSignUpConfirmationEmail',
  REFUND_PROCESSED = 'RefundProcessedEmail',
  ORDER_CONTACT = 'OrderContactEmail',

  SESSION_REPORT_ISSUE              = 'SessionReportIssueEmail',
  SESSION_CANCELED                  = 'SessionCanceledEmail',
}

export interface SendEmailProps {
  from: string;
  to: string;
  type: EmailTemplate;
  message: Record<string, any>;
}

export const EMAIL_TEMPLATE_TITLES: Record<EmailTemplate, string> = {
  [EmailTemplate.USER_SIGN_UP_CONFIRMATION]: 'Welcome to MentorUp - Your Journey Begins Here!',
  [EmailTemplate.MENTEE_APPOINTMENT_REQUEST]: 'Appointment Request - Waiting for Mentor Confirmation',
  [EmailTemplate.MENTOR_APPOINTMENT_REQUEST]: '[Action Required] Appointment Request - A mentee has scheduled a session with you',
  [EmailTemplate.APPOINTMENT_CONFIRMATION]: 'Congratulations! Your appointment has been confirmed',
  [EmailTemplate.RESCHEDULE_PROPOSAL_SENT]: 'Reschedule Proposal Sent - Waiting for Confirmation',
  [EmailTemplate.RESCHEDULE_PROPOSAL_RECEIVED]: '[Action Required] There is a reschedule request to your mentorup appointment',
  [EmailTemplate.REFUND_PROCESSED]: 'Your Refund from MentorUp Has Been Processed',
  [EmailTemplate.ORDER_CONTACT]: 'We\'ve Received Your Request About Your Appointment',
  [EmailTemplate.SESSION_REPORT_ISSUE]:            '[Action Required] Issue Reported for Your Session',
  [EmailTemplate.SESSION_CANCELED]:       'Your MentorUp Session Has Been Canceled',
};

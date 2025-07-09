export enum EmailTemplate {
  MENTEE_APPOINTMENT_REQUEST = 'MenteeApptRequestEmail',
  MENTOR_APPOINTMENT_REQUEST = 'MentorApptRequestEmail',
  APPOINTMENT_CONFIRMATION = 'ApptConfirmationEmail',
  RESCHEDULE_PROPOSAL_SENT = 'RescheduleProposalSentEmail',
  RESCHEDULE_PROPOSAL_RECEIVED = 'RescheduleProposalReceivedEmail',
  USER_SIGN_UP_CONFIRMATION = 'UserSignUpConfirmationEmail',
  REFUND_PROCESSED = 'RefundProcessedEmail',
  ORDER_CONTACT = 'OrderContactEmail',

  // mentor → mentee
  MENTOR_RESCHEDULE_REQUEST         = 'MentorRescheduleRequestEmail',
  MENTOR_APPOINTMENT_ACCEPTED       = 'MentorAppointmentAcceptedEmail',
  MENTOR_APPOINTMENT_DECLINED       = 'MentorAppointmentDeclinedEmail',

  // mentee → mentor
  MENTEE_RESCHEDULE_REQUEST         = 'MenteeRescheduleRequestEmail',
  MENTEE_APPOINTMENT_ACCEPTED       = 'MenteeAppointmentAcceptedEmail',
  MENTEE_APPOINTMENT_DECLINED       = 'MenteeAppointmentDeclinedEmail',
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
// <<<<<<< HEAD
  [EmailTemplate.ORDER_CONTACT]: 'We\'ve Received Your Request About Your Appointment',
// =======
//   [EmailTemplate.ORDER_CONTACT]: 'We’ve Received Your Request About Your Appointment',
//
//   // mentor → mentee
//   [EmailTemplate.MENTOR_RESCHEDULE_REQUEST]:       'Your Mentor Wants to Reschedule Your Session',
//   [EmailTemplate.MENTOR_APPOINTMENT_ACCEPTED]:     'Your Mentor Confirmed Your Session',
//   [EmailTemplate.MENTOR_APPOINTMENT_DECLINED]:     'Your Mentor Declined the Proposed Time',
//
//   // mentee → mentor
//   [EmailTemplate.MENTEE_RESCHEDULE_REQUEST]:       'Your Mentee Wants to Reschedule the Session',
//   [EmailTemplate.MENTEE_APPOINTMENT_ACCEPTED]:     'Your Mentee Confirmed the Session',
//   [EmailTemplate.MENTEE_APPOINTMENT_DECLINED]:     'Your Mentee Declined the Proposed Time',
// >>>>>>> 39dd1a5 (reschedule flow)
};

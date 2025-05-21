export enum EmailTemplate {
  MENTEE_APPOINTMENT_CONFIRMATION = 'MenteeApptConfirmationEmail',
  USER_SIGN_UP_CONFIRMATION = 'UserSignUpConfirmationEmail',
}

export interface SendEmailProps {
  from: string;
  to: string;
  type: EmailTemplate;
  message: Record<string, any>;
}

export const EMAIL_TEMPLATE_TITLES: Record<EmailTemplate, string> = {
  [EmailTemplate.USER_SIGN_UP_CONFIRMATION]: 'Welcome to MentorUp - Your Journey Begins Here!',
  [EmailTemplate.MENTEE_APPOINTMENT_CONFIRMATION]: 'Appointment Confirmation - Your Mentorship Session'
};
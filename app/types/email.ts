export enum EmailTemplate {
  MENTEE_APPOINTMENT_CONFIRMATION = 'MenteeApptConfirmationEmail'
}

export interface SendEmailProps {
  from: string;
  to: string;
  subject: string;
  type: EmailTemplate;
  message: Record<string, any>;
}
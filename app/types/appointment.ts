export interface Appointment {
    id: string; // Unique identifier for the appointment
    mentor_id: string;
    mentee_id: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string;
    updated_at: string;
    service_type: string;
    price: number;
    link?: string;  // Google Meet link
    cancel_reason?: string;  // Reason for cancellation
}

export interface CreateAppointmentInput {
    mentor_id: string;
    mentee_id: string;
    start_time: string;  // ISO string format
    end_time: string;    // ISO string format
    service_type: string;
    price: number;
    resume_url?: string; // 加上resume的url
}

export interface ConfirmAppointmentPaidInput {
    appointment_id: string;
}

export interface CancelAppointmentInput {
    appointment_id: string;
}

export interface UpdateAppointmentInput {
    appointment_id: string;
    status?: 'confirmed' | 'completed' | 'canceled' | 'noshow';
    link?: string;  // Google Meet link
    extra_info?: string; // Extra information
    description?: string; // Description
    cancel_reason?: string; // Reason for cancellation
}

export interface ReserveAppointmentResponse {
    appointment_id: string;
    status: string;
}
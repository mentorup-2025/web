export interface Appointment {
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
    time_slot?: [string, string];  // [start_time, end_time]
    status?: 'confirmed' | 'completed' | 'canceled' | 'noshow';
    link?: string;  // Google Meet link
    resume_url?: string; // Resume URL
    extra_info?: string; // Extra information
    description?: string; // Description
}

export interface ReserveAppointmentResponse {
    appointment_id: string;
    status: string;
}
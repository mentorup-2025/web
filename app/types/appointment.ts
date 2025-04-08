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
}

export interface CreateAppointmentInput {
    mentor_id: string;
    mentee_id: string;
    start_time: string;  // ISO string format
    end_time: string;    // ISO string format
    service_type: string;
    price: number;
}

export interface ReserveAppointmentResponse {
    appointment_id: string;
    status: string;
}
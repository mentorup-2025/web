export interface Availability {
  id?: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface SetAvailabilityRequest {
  user_id: string;
  availabilities: Omit<Availability, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
} 
export interface Event {
  id: number;
  description: string;
  max_attendees: number;
  message_id?: number;
  created_at: string;
}

export interface Attendee {
  id: number;
  event_id: number;
  user_id: number;
  name: string;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type Role = 'professor' | 'auxiliar' | 'admin';
export type Room = 'bebes' | 'pequenos' | 'grandes' | null;
export type EventType = 'terca' | 'sabado' | 'domingo';
export type AssignedRoom = 'bebes' | 'pequenos' | 'grandes' | 'unificada';

export interface Volunteer {
  id: string;
  phone: string;
  pin_hash: string;
  name: string;
  role: Role;
  room: Room;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  event_date: string;
  event_type: EventType;
  month: number;
  year: number;
  is_published: boolean;
  created_at: string;
}

export interface Unavailability {
  id: string;
  volunteer_id: string;
  event_id: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  event_id: string;
  volunteer_id: string;
  assigned_role: 'professor' | 'auxiliar';
  assigned_room: AssignedRoom;
  month: number;
  year: number;
  created_at: string;
}

export interface EbdPairHistory {
  id: string;
  professor1_id: string;
  professor2_id: string;
  month: number;
  year: number;
  created_at: string;
}

export interface Session {
  id: string;
  volunteer_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createDemoClient } from './demo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// DEV-ONLY: NEXT_PUBLIC_DEMO_MODE=1 in local `next dev` swaps Supabase for in-memory demo data
// (used for layout screenshots). It is ignored in production builds.
export const isDemo =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export const supabase: SupabaseClient = isDemo
  ? (createDemoClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  number: string;
  type: 'standard' | 'deluxe' | 'suite' | 'family';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  price_per_night: number;
  capacity: number;
  floor: number | null;
  amenities: string[];
  photo_url: string | null;
};

export type Employee = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  role: 'admin' | 'receptionist' | 'housekeeping' | 'maintenance' | 'manager';
  points: number;
  level: number;
  avatar_url: string | null;
  phone: string | null;
  position?: string | null;
  is_active?: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  location: string | null;
  unit: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  employee_id: string | null;
  room_id: string | null;
  points: number;
  status: 'pending' | 'in_progress' | 'completed';
  type: string;
  is_daily: boolean;
  completed_at: string | null;
};

export type Booking = {
  id: string;
  room_id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  status: string;
  notes: string | null;
  created_at: string;
  guest_id?: string | null;
};

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  points_required: number;
  icon: string;
};

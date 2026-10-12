import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  number: string;
  type: 'standard' | 'deluxe' | 'suite' | 'family';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  price_per_night: number;
  capacity: number;
  floor: number | null;
  amenities: string[];
};

export type Employee = {
  id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'receptionist' | 'housekeeping' | 'maintenance' | 'manager';
  points: number;
  level: number;
  avatar_url: string | null;
  phone: string | null;
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
  type: 'cleaning' | 'checkin' | 'checkout' | 'maintenance' | 'inventory' | 'other';
  completed_at: string | null;
};

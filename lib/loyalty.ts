import { supabase } from './supabase';

// ДОПУЩЕНИЕ: гость получает баллы = 5% от суммы проживания (цена за ночь × ночи), 1 балл = 1 сом.
// Поменять процент — только здесь.
export const LOYALTY_PERCENT = 5;

export const pointsForStay = (pricePerNight: number, nightsCount: number) =>
  Math.floor((pricePerNight * nightsCount * LOYALTY_PERCENT) / 100);

export type Guest = {
  id: string; auth_user_id: string | null; name: string; email: string | null; phone: string | null;
  points: number; created_at?: string;
};
export type LoyaltyTx = {
  id: string; guest_id: string; booking_id: string | null; points: number; reason: string;
  created_by: string | null; created_at: string;
};

// Начислить баллы за проживание при выселении (один раз на бронь).
export async function awardStayPoints(bookingId: string) {
  const { data: b } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!b?.guest_id) return;
  const { data: existing } = await supabase.from('loyalty_transactions').select('*').eq('booking_id', bookingId).eq('reason', 'stay');
  if (existing && existing.length) return;
  const { data: room } = await supabase.from('rooms').select('*').eq('id', b.room_id).single();
  if (!room) return;
  const n = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
  const pts = pointsForStay(Number(room.price_per_night), n);
  if (pts <= 0) return;
  await adjustPoints(b.guest_id, pts, 'stay', null, bookingId);
}

export async function adjustPoints(guestId: string, delta: number, reason: string, employeeId: string | null, bookingId: string | null = null) {
  // Баланс guests.points пересчитывает триггер в базе (см. миграцию), клиент пишет только операцию.
  const { error } = await supabase.from('loyalty_transactions')
    .insert({ guest_id: guestId, booking_id: bookingId, points: delta, reason, created_by: employeeId });
  return { error: error?.message ?? null };
}

export const reasonLabel = (r: string) => (r === 'stay' ? 'Начисление за проживание' : r);

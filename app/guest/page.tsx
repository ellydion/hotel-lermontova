'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, LogOut, Coffee, ExternalLink, Gift, CalendarDays } from 'lucide-react';
import { supabase, isDemo, Booking, Room } from '@/lib/supabase';
import { Guest, LoyaltyTx, LOYALTY_PERCENT, reasonLabel } from '@/lib/loyalty';
import { bookingStatus, fmtDate, nights, roomType } from '@/lib/ui';

const RESTAURANT_URL = 'https://macherie.coffee';

export default function GuestHome() {
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tx, setTx] = useState<LoyaltyTx[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'none'>('loading');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/guest/login'); return; }
      const { data: g } = await supabase.from('guests').select('*').eq('auth_user_id', data.user.id).maybeSingle();
      if (!g) { setState('none'); return; }
      setGuest(g as Guest);
      const [b, r, t] = await Promise.all([
        supabase.from('bookings').select('*').eq('guest_id', g.id).order('check_in', { ascending: false }),
        supabase.from('rooms').select('*'),
        supabase.from('loyalty_transactions').select('*').eq('guest_id', g.id).order('created_at', { ascending: false }),
      ]);
      setBookings((b.data as Booking[]) || []);
      setRooms((r.data as Room[]) || []);
      setTx((t.data as LoyaltyTx[]) || []);
      setState('ok');
    })();
  }, [router]);

  const logout = async () => { await supabase.auth.signOut(); router.push('/guest/login'); };
  const room = (id: string) => rooms.find((r) => r.id === id);

  return (
    <div className="min-h-screen bg-[#f3f4f7]">
      <header className="bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><Hotel className="w-5 h-5 text-gold-400" /> Отель Лермонтова</div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/70"><LogOut className="w-4 h-4" />Выйти</button>
        </div>
      </header>
      {isDemo && <div className="bg-gold-100 text-navy-900 text-xs text-center py-1">Демо-режим (только локально): данные вымышленные</div>}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {state === 'loading' && <p className="text-center text-slate-400 py-16 text-sm">Загрузка…</p>}
        {state === 'none' && <div className="card p-8 text-center text-sm text-slate-500">Профиль гостя не найден. Обратитесь на ресепшен.</div>}
        {state === 'ok' && guest && <>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-navy-900">Здравствуйте, {guest.name.split(' ')[0]}!</h1>
            <p className="text-sm text-slate-500 mt-1">Ваши брони и бонусные баллы</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 bg-navy-900 text-white">
              <div className="flex items-center gap-2 text-gold-400 text-sm font-medium"><Gift className="w-4 h-4" />Бонусные баллы</div>
              <p className="text-5xl font-bold mt-3">{guest.points.toLocaleString('ru-RU')}</p>
              <p className="text-sm text-white/60 mt-2">{LOYALTY_PERCENT}% от суммы каждого проживания возвращается баллами</p>
            </div>
            <a href={RESTAURANT_URL} target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl p-6 bg-gold-400 text-navy-950 flex flex-col justify-between hover:bg-gold-500 transition">
              <div className="flex items-center gap-2 text-sm font-medium"><Coffee className="w-4 h-4" />Наш ресторан</div>
              <div>
                <p className="text-2xl font-bold mt-3">Меню ресторана Ma Cherie</p>
                <p className="text-sm text-navy-900/70 mt-1">Кофе, выпечка, десерты и напитки — посмотрите меню на macherie.coffee</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 font-semibold">Открыть меню <ExternalLink className="w-4 h-4" /></span>
            </a>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-navy-900 flex items-center gap-2 mb-3"><CalendarDays className="w-5 h-5 text-gold-600" />Мои брони</h2>
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const r = room(b.room_id); const st = bookingStatus[b.status];
                return (
                  <div key={b.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="font-medium text-navy-900">Номер {r?.number ?? '—'} · {r ? roomType[r.type] : ''}</p>
                      <p className="text-xs text-slate-500">{fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {nights(b.check_in, b.check_out)} ноч.</p>
                    </div>
                    {st && <span className={`chip ${st.cls}`}>{st.label}</span>}
                  </div>
                );
              })}
              {!bookings.length && <p className="text-sm text-slate-400 py-2">Броней пока нет</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-navy-900 mb-3">История баллов</h2>
            <div className="divide-y divide-slate-100">
              {tx.map((t) => (
                <div key={t.id} className="py-2.5 flex justify-between text-sm">
                  <span>{reasonLabel(t.reason)}<span className="block text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('ru-RU')}</span></span>
                  <span className={`font-semibold ${t.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</span>
                </div>
              ))}
              {!tx.length && <p className="text-sm text-slate-400 py-2">Операций пока нет</p>}
            </div>
          </div>
        </>}
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogIn, LogOut, Sparkles, Wrench, RefreshCw, ChevronRight } from 'lucide-react';
import { awardStayPoints } from '@/lib/loyalty';
import { supabase, Booking, Room } from '@/lib/supabase';
import { PageHeader, Loading } from '@/components/AppShell';
import { roomStatus, todayISO, initials, roomType } from '@/lib/ui';

export default function TodayPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([
      supabase.from('rooms').select('*').order('number'),
      supabase.from('bookings').select('*').order('check_in', { ascending: true }),
    ]);
    setRooms((r.data as Room[]) || []);
    setBookings((b.data as Booking[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    if (status === 'checked_out') await awardStayPoints(id);
    load();
  };

  const today = todayISO();
  const arrivals = bookings.filter((b) => b.check_in === today && b.status === 'confirmed');
  const departures = bookings.filter((b) => b.check_out === today && b.status === 'checked_in');
  const count = (s: string) => rooms.filter((r) => r.status === s).length;
  const stayFor = (roomId: string) =>
    bookings.find((b) => b.room_id === roomId && b.status === 'checked_in')
    || bookings.find((b) => b.room_id === roomId && b.status === 'confirmed' && b.check_in === today);

  const tiles = [
    { label: 'Заезд', value: arrivals.length, icon: LogIn, href: '/bookings?f=arrivals' },
    { label: 'Выезд', value: departures.length, icon: LogOut, href: '/bookings?f=departures' },
    { label: 'Уборка', value: count('cleaning'), icon: Sparkles, href: '/rooms?s=cleaning' },
    { label: 'Ремонт', value: count('maintenance'), icon: Wrench, href: '/rooms?s=maintenance' },
  ];
  const dateLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <PageHeader title="Сегодня" subtitle={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        action={<button onClick={load} className="btn-ghost"><RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Обновить</span></button>} />
      {loading ? <Loading /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {tiles.map(({ label, value, icon: Icon, href }) => (
              <Link key={label} href={href} className="rounded-2xl bg-navy-900 text-white p-4 lg:p-5 flex flex-col gap-4 hover:bg-navy-800">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Icon className="w-5 h-5 text-gold-400" /></div>
                  <span className="text-3xl font-bold">{value}</span>
                </div>
                <span className="text-sm font-medium text-white/80">{label}</span>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <section className="card lg:col-span-2">
              <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-navy-900">Номера</h2>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {Object.values(roomStatus).map((s) => (
                    <span key={s.label} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />{s.label}</span>
                  ))}
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {rooms.length === 0 && <li className="p-5 text-sm text-slate-400">Номеров нет</li>}
                {rooms.map((room) => {
                  const st = roomStatus[room.status] || roomStatus.available;
                  const b = stayFor(room.id);
                  const isArrival = b && b.status === 'confirmed';
                  const isDeparture = b && b.status === 'checked_in' && b.check_out === today;
                  return (
                    <li key={room.id} className="px-5 py-3 flex items-center gap-3">
                      <span className={`w-1.5 self-stretch rounded-full ${st.dot}`} />
                      <div className="w-14 shrink-0">
                        <p className="font-bold text-navy-900">{room.number}</p>
                        <p className="text-[11px] text-slate-400">{roomType[room.type] || room.type}</p>
                      </div>
                      {b ? (
                        <Link href={`/bookings/${b.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-9 h-9 rounded-full bg-gold-100 text-gold-600 text-xs font-semibold flex items-center justify-center shrink-0">{initials(b.guest_name)}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-navy-900 truncate">{b.guest_name}</span>
                            <span className="block text-xs text-slate-500">{isArrival ? 'Заезд сегодня' : isDeparture ? 'Выезд сегодня' : `до ${new Date(b.check_out + 'T00:00:00').toLocaleDateString('ru-RU')}`}</span>
                          </span>
                        </Link>
                      ) : (
                        <span className={`flex-1 text-sm ${st.text}`}>{st.label}</span>
                      )}
                      {isArrival && <button onClick={() => updateStatus(b!.id, 'checked_in')} className="btn-primary px-3 py-1.5 text-xs">Заселить</button>}
                      {isDeparture && <button onClick={() => updateStatus(b!.id, 'checked_out')} className="btn-gold px-3 py-1.5 text-xs">Выселить</button>}
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="space-y-6">
              {[{ t: 'Заезды сегодня', list: arrivals }, { t: 'Выезды сегодня', list: departures }].map(({ t, list }) => (
                <section key={t} className="card p-5">
                  <h2 className="font-semibold text-navy-900 mb-3">{t}</h2>
                  {list.length === 0 && <p className="text-sm text-slate-400">Нет</p>}
                  <ul className="space-y-1">
                    {list.map((b) => (
                      <li key={b.id}>
                        <Link href={`/bookings/${b.id}`} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50">
                          <span className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs flex items-center justify-center">{initials(b.guest_name)}</span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">{b.guest_name}</span>
                            <span className="block text-xs text-slate-500">Номер {rooms.find((r) => r.id === b.room_id)?.number || '—'}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

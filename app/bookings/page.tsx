'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ChevronRight, X } from 'lucide-react';
import { supabase, Booking, Room } from '@/lib/supabase';
import { PageHeader, Loading } from '@/components/AppShell';
import { bookingStatus, fmtDate, initials, todayISO } from '@/lib/ui';

const empty = { room_id: '', guest_name: '', guest_phone: '', guest_email: '', check_in: '', check_out: '', notes: '' };

function BookingsList() {
  const params = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState(params.get('f') || 'all');

  const load = async () => {
    setLoading(true);
    const [bRes, rRes] = await Promise.all([
      supabase.from('bookings').select('*').order('check_in', { ascending: false }),
      supabase.from('rooms').select('*').order('number'),
    ]);
    setBookings((bRes.data as Booking[]) || []);
    setRooms((rRes.data as Room[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.from('bookings').insert(form);
    if (error) { setError(error.message); return; }
    setShowForm(false);
    setForm(empty);
    load();
  };

  const today = todayISO();
  const tabs: [string, string, (b: Booking) => boolean][] = [
    ['all', 'Все', () => true],
    ['arrivals', 'Заезды сегодня', (b) => b.check_in === today && b.status === 'confirmed'],
    ['departures', 'Выезды сегодня', (b) => b.check_out === today && b.status === 'checked_in'],
    ['checked_in', 'Проживают', (b) => b.status === 'checked_in'],
    ['confirmed', 'Подтверждены', (b) => b.status === 'confirmed'],
  ];
  const fn = (tabs.find((t) => t[0] === tab) || tabs[0])[2];
  const list = bookings.filter(fn).filter((b) =>
    !q || [b.guest_name, b.guest_phone, b.guest_email].some((v) => v?.toLowerCase().includes(q.toLowerCase())));
  const roomNo = (id: string) => rooms.find((r) => r.id === id)?.number || '—';
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="Брони" subtitle="Заселение, выезд и история бронирований"
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Новая бронь</span></button>} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <form onSubmit={createBooking} onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 grid grid-cols-2 gap-3 max-h-[90vh] overflow-y-auto">
            <div className="col-span-2 flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-navy-900">Новая бронь</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Закрыть"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <label className="col-span-2 text-xs text-slate-500">Номер
              <select value={form.room_id} onChange={set('room_id')} className="input mt-1" required>
                <option value="">Выберите свободный номер</option>
                {rooms.filter((r) => r.status === 'available').map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
              </select>
            </label>
            <label className="col-span-2 text-xs text-slate-500">Имя гостя<input value={form.guest_name} onChange={set('guest_name')} className="input mt-1" required /></label>
            <label className="text-xs text-slate-500">Телефон<input value={form.guest_phone} onChange={set('guest_phone')} className="input mt-1" /></label>
            <label className="text-xs text-slate-500">Email<input type="email" value={form.guest_email} onChange={set('guest_email')} className="input mt-1" /></label>
            <label className="text-xs text-slate-500">Заезд<input type="date" value={form.check_in} onChange={set('check_in')} className="input mt-1" required /></label>
            <label className="text-xs text-slate-500">Выезд<input type="date" value={form.check_out} onChange={set('check_out')} className="input mt-1" required /></label>
            <label className="col-span-2 text-xs text-slate-500">Заметки<textarea value={form.notes} onChange={set('notes')} rows={2} className="input mt-1" /></label>
            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary col-span-2 py-3">Создать бронь</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по гостю, телефону, email" className="input pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(([k, label, f]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${tab === k ? 'bg-navy-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                {label} <span className="opacity-60">{bookings.filter(f).length}</span>
              </button>
            ))}
          </div>
        </div>
        {loading ? <Loading /> : (
          <ul className="divide-y divide-slate-100">
            {list.length === 0 && <li className="p-8 text-center text-sm text-slate-400">Броней нет</li>}
            {list.map((b) => {
              const st = bookingStatus[b.status] || { label: b.status, cls: 'bg-slate-100 text-slate-600' };
              return (
                <li key={b.id}>
                  <Link href={`/bookings/${b.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <span className="w-10 h-10 rounded-full bg-navy-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initials(b.guest_name)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-navy-900 truncate">{b.guest_name}</span>
                      <span className="block text-xs text-slate-500">Номер {roomNo(b.room_id)} · {fmtDate(b.check_in)} — {fmtDate(b.check_out)}</span>
                    </span>
                    <span className={`chip ${st.cls} hidden sm:inline-flex`}>{st.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return <Suspense fallback={<Loading />}><BookingsList /></Suspense>;
}

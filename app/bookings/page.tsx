'use client';

import { useEffect, useState } from 'react';
import { supabase, Booking, Room } from '@/lib/supabase';
import { Plus, Calendar, User, CreditCard, Printer } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    room_id: '', guest_name: '', guest_phone: '', guest_email: '', check_in: '', check_out: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    const [bRes, rRes] = await Promise.all([
      supabase.from('bookings').select('*').order('check_in', { ascending: false }),
      supabase.from('rooms').select('*').order('number'),
    ]);
    setBookings(bRes.data || []);
    setRooms((rRes.data as Room[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bookings').insert(form);
    if (!error) {
      setShowForm(false);
      setForm({ room_id: '', guest_name: '', guest_phone: '', guest_email: '', check_in: '', check_out: '', notes: '' });
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Бронирования</h1>
          <p className="text-slate-500 text-sm">Управление заселением и выездом</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Новая бронь
        </button>
      </div>

      {showForm && (
        <form onSubmit={createBooking} className="bg-white rounded-2xl shadow-soft p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} className="border rounded-lg px-3 py-2" required>
            <option value="">Номер</option>
            {rooms.filter(r => r.status === 'available').map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
          </select>
          <input placeholder="Имя гостя" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} className="border rounded-lg px-3 py-2" required />
          <input placeholder="Телефон" value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})} className="border rounded-lg px-3 py-2" />
          <input placeholder="Email" value={form.guest_email} onChange={e => setForm({...form, guest_email: e.target.value})} className="border rounded-lg px-3 py-2" />
          <input type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="border rounded-lg px-3 py-2" required />
          <input type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="border rounded-lg px-3 py-2" required />
          <button type="submit" className="md:col-span-2 bg-emerald-600 text-white py-2 rounded-lg">Создать бронь</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-3">
          {loading && <div className="text-center py-8 text-slate-400">Загрузка...</div>}
          {bookings.map(b => (
            <div
              key={b.id}
              onClick={() => setSelected(b)}
              className={`bg-white rounded-xl p-4 shadow-soft cursor-pointer border-2 ${
                selected?.id === b.id ? 'border-slate-900' : 'border-transparent'
              }`}
            >
              <p className="font-semibold">{b.guest_name}</p>
              <p className="text-sm text-slate-500">{b.check_in} → {b.check_out}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 mt-2 inline-block">{b.status}</span>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="bg-slate-900 text-white p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{selected.guest_name}</p>
                  <p className="text-sm text-slate-300">Резервация</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Номер</p>
                  <p className="font-medium">{rooms.find(r => r.id === selected.room_id)?.number || '—'}</p>
                  <p className="text-sm text-slate-500 mt-4">Даты</p>
                  <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> {selected.check_in} — {selected.check_out}</p>
                  {selected.guest_phone && <p className="text-sm">{selected.guest_phone}</p>}
                  {selected.guest_email && <p className="text-sm text-slate-500">{selected.guest_email}</p>}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Статус</p>
                  <p className="font-semibold text-lg capitalize">{selected.status}</p>

                  <div className="flex flex-col gap-2 mt-4">
                    {selected.status === 'confirmed' && (
                      <button onClick={() => updateStatus(selected.id, 'checked_in')} className="bg-slate-900 text-white py-2 rounded-lg text-sm">Заселить</button>
                    )}
                    {selected.status === 'checked_in' && (
                      <button onClick={() => updateStatus(selected.id, 'checked_out')} className="bg-slate-700 text-white py-2 rounded-lg text-sm">Выселить</button>
                    )}
                    <button className="border py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" /> Добавить оплату
                    </button>
                    <button className="border py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4" /> Печать карты
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-soft p-12 text-center text-slate-400">
              Выберите бронь слева, чтобы увидеть детали
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

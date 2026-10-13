'use client';

import { useEffect, useState } from 'react';
import { supabase, Booking, Room } from '@/lib/supabase';
import { Plus, Calendar } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    room_id: '',
    guest_name: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    const [bRes, rRes] = await Promise.all([
      supabase.from('bookings').select('*').order('check_in', { ascending: false }),
      supabase.from('rooms').select('id, number, status').order('number'),
    ]);
    setBookings(bRes.data || []);
    setRooms(rRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bookings').insert(form);
    if (!error) {
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id);
      setShowForm(false);
      setForm({ room_id: '', guest_name: '', guest_phone: '', check_in: '', check_out: '', notes: '' });
      load();
    } else {
      alert(error.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hotel-900">Бронирования</h1>
          <p className="text-slate-600">Управление заселением и выездом</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-hotel-600 text-white rounded-lg hover:bg-hotel-700">
          <Plus className="w-4 h-4" /> Новое бронирование
        </button>
      </div>

      {showForm && (
        <form onSubmit={createBooking} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} className="border rounded-lg px-3 py-2" required>
              <option value="">Выберите номер</option>
              {rooms.filter(r => r.status === 'available').map(r => (
                <option key={r.id} value={r.id}>{r.number}</option>
              ))}
            </select>
            <input placeholder="Имя гостя" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className="border rounded-lg px-3 py-2" required />
            <input placeholder="Телефон" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} className="border rounded-lg px-3 py-2" />
            <input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="border rounded-lg px-3 py-2" required />
            <input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="border rounded-lg px-3 py-2" required />
          </div>
          <textarea placeholder="Примечания" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Создать</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const room = rooms.find(r => r.id === b.room_id);
            return (
              <div key={b.id} className="bg-white rounded-xl shadow p-5 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{b.guest_name}</p>
                  <p className="text-sm text-slate-600">Номер: {room?.number || b.room_id}</p>
                  <p className="text-sm flex items-center gap-1 mt-1"><Calendar className="w-4 h-4" />{b.check_in} → {b.check_out}</p>
                  {b.guest_phone && <p className="text-sm text-slate-500">{b.guest_phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    b.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                    b.status === 'checked_out' ? 'bg-slate-100' : 'bg-emerald-100 text-emerald-800'
                  }`}>{b.status}</span>
                  {b.status === 'confirmed' && (
                    <button onClick={() => updateStatus(b.id, 'checked_in')} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded">Заселить</button>
                  )}
                  {b.status === 'checked_in' && (
                    <button onClick={() => updateStatus(b.id, 'checked_out')} className="text-xs px-3 py-1 bg-slate-50 text-slate-700 rounded">Выселить</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

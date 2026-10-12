'use client';

import { useEffect, useState } from 'react';
import { supabase, Room } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  occupied: 'bg-blue-100 text-blue-800',
  cleaning: 'bg-amber-100 text-amber-800',
  maintenance: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  available: 'Свободен',
  occupied: 'Занят',
  cleaning: 'Уборка',
  maintenance: 'Ремонт',
};

const typeLabels: Record<string, string> = {
  standard: 'Стандарт',
  deluxe: 'Делюкс',
  suite: 'Люкс',
  family: 'Семейный',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('rooms').select('*').order('number');
    setRooms(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('rooms').update({ status }).eq('id', id);
    load();
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hotel-900">Номера</h1>
          <p className="text-slate-600">Управление номерным фондом</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-hotel-600 text-white rounded-lg hover:bg-hotel-700">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? 'bg-hotel-700 text-white' : 'bg-white border text-slate-700'}`}>
            {s === 'all' ? 'Все' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-hotel-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold">{room.number}</p>
                  <p className="text-sm text-slate-500">{typeLabels[room.type]} • {room.capacity} гостя</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[room.status]}`}>
                  {statusLabels[room.status]}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold text-hotel-700">{room.price_per_night.toLocaleString()} ₽ / ночь</p>
              <div className="mt-4 flex gap-2">
                {room.status !== 'available' && (
                  <button onClick={() => updateStatus(room.id, 'available')} className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">Освободить</button>
                )}
                {room.status !== 'cleaning' && (
                  <button onClick={() => updateStatus(room.id, 'cleaning')} className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100">На уборку</button>
                )}
                {room.status !== 'occupied' && (
                  <button onClick={() => updateStatus(room.id, 'occupied')} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Заселить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

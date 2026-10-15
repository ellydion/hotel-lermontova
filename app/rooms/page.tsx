'use client';

import { useEffect, useState } from 'react';
import { supabase, Room } from '@/lib/supabase';
import { RefreshCw, Upload } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-blue-500',
  cleaning: 'bg-amber-500',
  maintenance: 'bg-red-500',
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
  const [filter, setFilter] = useState('all');

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Номера</h1>
          <p className="text-slate-500 mt-1">Визуальная карта номерного фонда</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'
            }`}
          >
            {s === 'all' ? 'Все' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(room => (
            <div
              key={room.id}
              className={`rounded-xl p-3 text-white ${statusColors[room.status]} shadow-sm hover:shadow-md transition`}
            >
              <p className="text-xl font-bold">{room.number}</p>
              <p className="text-xs opacity-90 mt-1">{typeLabels[room.type]}</p>
              <p className="text-[11px] mt-2 opacity-80">{statusLabels[room.status]}</p>
              <div className="mt-3 flex gap-1">
                {room.status !== 'available' && (
                  <button onClick={() => updateStatus(room.id, 'available')} className="text-[10px] bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded">Своб</button>
                )}
                {room.status !== 'cleaning' && (
                  <button onClick={() => updateStatus(room.id, 'cleaning')} className="text-[10px] bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded">Убор</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

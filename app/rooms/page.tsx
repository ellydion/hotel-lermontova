'use client';

import { useEffect, useState } from 'react';
import { supabase, Room } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
  available: { color: 'bg-emerald-500', label: 'Свободен', bg: 'bg-emerald-50' },
  occupied: { color: 'bg-blue-500', label: 'Занят', bg: 'bg-blue-50' },
  cleaning: { color: 'bg-amber-400', label: 'Уборка', bg: 'bg-amber-50' },
  maintenance: { color: 'bg-red-500', label: 'Ремонт', bg: 'bg-red-50' },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [floor, setFloor] = useState('all');

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

  const floors = Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))).sort();
  const filtered = rooms.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (floor !== 'all' && String(r.floor) !== floor) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Карта номеров</h1>
          <p className="text-slate-500 text-sm mt-1">Визуальный обзор статусов</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm self-start">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              filter === key ? 'ring-2 ring-offset-1 ring-slate-900' : ''
            } ${cfg.bg}`}
          >
            <span className={`w-3 h-3 rounded ${cfg.color}`} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Floor filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFloor('all')}
          className={`px-3 py-1 rounded-lg text-sm ${
            floor === 'all' ? 'bg-slate-900 text-white' : 'bg-white border'
          }`}
        >
          Все этажи
        </button>
        {floors.map(f => (
          <button
            key={f}
            onClick={() => setFloor(String(f))}
            className={`px-3 py-1 rounded-lg text-sm ${
              floor === String(f) ? 'bg-slate-900 text-white' : 'bg-white border'
            }`}
          >
            Этаж {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Загрузка карты...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filtered.map(room => {
            const cfg = statusConfig[room.status] || statusConfig.available;
            return (
              <div
                key={room.id}
                className={`rounded-xl border p-3 ${cfg.bg} hover:shadow-md transition cursor-pointer`}
                onClick={() => updateStatus(room.id, room.status === 'available' ? 'occupied' : 'available')}
              >
                <div className="flex items-start justify-between">
                  <p className="text-2xl font-bold">{room.number}</p>
                  <span className={`w-3 h-3 rounded-full ${cfg.color} mt-1`} />
                </div>
                <p className="text-xs text-slate-600 mt-1 capitalize">{room.type}</p>
                <p className="text-[11px] text-slate-500 mt-2">{cfg.label}</p>
                {room.status === 'occupied' && (
                  <p className="text-[11px] font-medium text-blue-700 mt-1 truncate">Гость</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

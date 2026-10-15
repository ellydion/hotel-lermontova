'use client';

import { useEffect, useState } from 'react';
import { supabase, Room } from '@/lib/supabase';
import { RefreshCw, Upload, AlertTriangle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('rooms').select('*').order('number');
      if (error) throw error;
      setRooms(data || []);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('rooms').update({ status }).eq('id', id);
    load();
  };

  const uploadPhoto = async (roomId: string, file: File) => {
    setUploading(roomId);
    const fileName = `${roomId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('room-photos').upload(fileName, file, { upsert: true });

    if (error) {
      alert('Ошибка загрузки: ' + error.message + '\nСоздайте public bucket "room-photos" в Supabase Storage.');
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('room-photos').getPublicUrl(fileName);
    await supabase.from('rooms').update({ photo_url: urlData.publicUrl }).eq('id', roomId);
    setUploading(null);
    load();
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Номера</h1>
          <p className="text-slate-500 mt-1">Управление номерным фондом</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 shadow-soft self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === s
                ? 'bg-slate-900 text-white shadow-soft'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'Все' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-slate-100 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700">{error}</p>
          <button onClick={load} className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-lg text-sm">Повторить</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center text-slate-400">
          Номера не найдены
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-card transition-shadow group">
              <div className="relative h-48 bg-slate-100">
                {room.photo_url ? (
                  <img src={room.photo_url} alt={room.number} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">Нет фото</div>
                )}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[room.status]}`}>
                  {statusLabels[room.status]}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{room.number}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{typeLabels[room.type]} · {room.capacity} гостей</p>
                  </div>
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-900">{room.price_per_night.toLocaleString()} <span className="text-sm font-normal text-slate-500">₽ / ночь</span></p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {room.status !== 'available' && (
                    <button onClick={() => updateStatus(room.id, 'available')} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">Освободить</button>
                  )}
                  {room.status !== 'cleaning' && (
                    <button onClick={() => updateStatus(room.id, 'cleaning')} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium">На уборку</button>
                  )}
                  {room.status !== 'occupied' && (
                    <button onClick={() => updateStatus(room.id, 'occupied')} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">Заселить</button>
                  )}
                  <label className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-1 font-medium">
                    <Upload className="w-3 h-3" />
                    {uploading === room.id ? '...' : 'Фото'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(room.id, e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

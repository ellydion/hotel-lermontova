'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Users, Calendar, RefreshCw, AlertTriangle, DoorOpen } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    occupancy: 0,
    totalRooms: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    todayArrivals: 0,
    todayDepartures: 0,
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        supabase.from('rooms').select('*').order('number'),
        supabase.from('bookings').select('*').order('check_in', { ascending: false }).limit(8),
      ]);

      const roomData = roomsRes.data || [];
      const total = roomData.length;
      const occupied = roomData.filter((r: any) => r.status === 'occupied').length;
      const available = roomData.filter((r: any) => r.status === 'available').length;
      const cleaning = roomData.filter((r: any) => r.status === 'cleaning').length;
      const maintenance = roomData.filter((r: any) => r.status === 'maintenance').length;

      setRooms(roomData);
      setRecentBookings(bookingsRes.data || []);
      setStats({
        occupancy: total > 0 ? Math.round((occupied / total) * 100) : 0,
        totalRooms: total,
        available,
        occupied,
        cleaning,
        maintenance,
        todayArrivals: 4,
        todayDepartures: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusColor: Record<string, string> = {
    available: 'bg-emerald-400',
    occupied: 'bg-blue-500',
    cleaning: 'bg-amber-400',
    maintenance: 'bg-red-400',
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Загрузка дашборда...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Дашборд</h1>
          <p className="text-slate-500 mt-1">Отель Лермонтова — обзор на сегодня</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-sm text-slate-500">Загрузка</p>
          <p className="text-3xl font-bold mt-1">{stats.occupancy}%</p>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${stats.occupancy}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-sm text-slate-500">Свободно / Всего</p>
          <p className="text-3xl font-bold mt-1">{stats.available} / {stats.totalRooms}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-sm text-slate-500">Заезды сегодня</p>
          <p className="text-3xl font-bold mt-1">{stats.todayArrivals}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-sm text-slate-500">Выезды сегодня</p>
          <p className="text-3xl font-bold mt-1">{stats.todayDepartures}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Status Grid */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Статусы номеров
          </h2>
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> Свободен</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Занят</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Уборка</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Ремонт</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {rooms.slice(0, 48).map((room) => (
              <div
                key={room.id}
                title={`${room.number} — ${room.status}`}
                className={`h-8 rounded-md ${statusColor[room.status] || 'bg-slate-300'} flex items-center justify-center text-[10px] font-medium text-white`}
              >
                {room.number}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Последние брони
          </h2>
          <div className="space-y-3">
            {recentBookings.length === 0 && <p className="text-slate-400 text-sm">Нет бронирований</p>}
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium">{b.guest_name}</p>
                  <p className="text-xs text-slate-500">{b.check_in} → {b.check_out}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { Building2, Users, Package, Trophy, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    rooms: { total: 0, available: 0, occupied: 0, cleaning: 0 },
    employees: 0,
    inventoryLow: 0,
    tasksPending: 0,
    topEmployee: null as Employee | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [roomsRes, empRes, invRes, tasksRes] = await Promise.all([
        supabase.from('rooms').select('status'),
        supabase.from('employees').select('*').order('points', { ascending: false }).limit(1),
        supabase.from('inventory').select('quantity, min_quantity'),
        supabase.from('tasks').select('status').eq('status', 'pending'),
      ]);

      const rooms = roomsRes.data || [];
      const lowInv = (invRes.data || []).filter((i: any) => i.quantity <= i.min_quantity).length;
      const empCountRes = await supabase.from('employees').select('id', { count: 'exact', head: true });

      setStats({
        rooms: {
          total: rooms.length,
          available: rooms.filter((r: any) => r.status === 'available').length,
          occupied: rooms.filter((r: any) => r.status === 'occupied').length,
          cleaning: rooms.filter((r: any) => r.status === 'cleaning').length,
        },
        employees: empCountRes.count || 0,
        inventoryLow: lowInv,
        tasksPending: (tasksRes.data || []).length,
        topEmployee: empRes.data?.[0] || null,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-500">Загрузка...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-hotel-900">Дашборд</h1>
        <p className="text-slate-600 mt-1">Обзор состояния отеля Лермонтова</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Building2 className="w-8 h-8" />} title="Номера" value={`${stats.rooms.available} / ${stats.rooms.total}`} subtitle="свободно" color="bg-emerald-500" />
        <StatCard icon={<Users className="w-8 h-8" />} title="Сотрудники" value={stats.employees.toString()} subtitle="в штате" color="bg-blue-500" />
        <StatCard icon={<Package className="w-8 h-8" />} title="Инвентарь" value={stats.inventoryLow.toString()} subtitle="позиций с низким запасом" color={stats.inventoryLow > 0 ? 'bg-amber-500' : 'bg-emerald-500'} />
        <StatCard icon={<Trophy className="w-8 h-8" />} title="Задания" value={stats.tasksPending.toString()} subtitle="ожидают выполнения" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-hotel-600" /> Статусы номеров</h2>
          <div className="space-y-2">
            <StatusBar label="Свободно" count={stats.rooms.available} total={stats.rooms.total} color="bg-emerald-500" />
            <StatusBar label="Занято" count={stats.rooms.occupied} total={stats.rooms.total} color="bg-blue-500" />
            <StatusBar label="Уборка" count={stats.rooms.cleaning} total={stats.rooms.total} color="bg-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-hotel-600" /> Лидер рейтинга</h2>
          {stats.topEmployee ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-hotel-100 flex items-center justify-center text-2xl font-bold text-hotel-700">{stats.topEmployee.name.charAt(0)}</div>
              <div>
                <p className="font-semibold text-lg">{stats.topEmployee.name}</p>
                <p className="text-slate-500 text-sm capitalize">{stats.topEmployee.role}</p>
                <p className="text-hotel-600 font-bold mt-1">{stats.topEmployee.points} баллов • Уровень {stats.topEmployee.level}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Нет данных</p>
          )}
        </div>
      </div>

      {stats.inventoryLow > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Внимание: низкий запас инвентаря</p>
            <p className="text-sm text-amber-700">{stats.inventoryLow} позиций требуют пополнения. Перейдите в раздел Инвентарь.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: any) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

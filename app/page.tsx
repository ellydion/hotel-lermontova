'use client';

import { useEffect, useState } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { Building2, Users, Package, Trophy, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    rooms: { total: 0, available: 0, occupied: 0, cleaning: 0 },
    employees: 0,
    inventoryLow: 0,
    tasksPending: 0,
    topEmployee: null as Employee | null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsRes, empRes, invRes, tasksRes] = await Promise.all([
        supabase.from('rooms').select('status'),
        supabase.from('employees').select('*').order('points', { ascending: false }).limit(1),
        supabase.from('inventory').select('quantity, min_quantity'),
        supabase.from('tasks').select('status').eq('status', 'pending'),
      ]);

      if (roomsRes.error) throw roomsRes.error;

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
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-soft animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-slate-700 font-medium">{error}</p>
        <button onClick={load} className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Дашборд</h1>
          <p className="text-slate-500 mt-1">Обзор состояния отеля Лермонтова</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<Building2 className="w-6 h-6" />} title="Номера" value={`${stats.rooms.available} / ${stats.rooms.total}`} subtitle="свободно" accent="emerald" />
        <StatCard icon={<Users className="w-6 h-6" />} title="Сотрудники" value={stats.employees.toString()} subtitle="в штате" accent="blue" />
        <StatCard icon={<Package className="w-6 h-6" />} title="Инвентарь" value={stats.inventoryLow.toString()} subtitle="низкий запас" accent={stats.inventoryLow > 0 ? 'amber' : 'emerald'} />
        <StatCard icon={<Trophy className="w-6 h-6" />} title="Задания" value={stats.tasksPending.toString()} subtitle="ожидают" accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" /> Статусы номеров
          </h2>
          <div className="space-y-3">
            <StatusBar label="Свободно" count={stats.rooms.available} total={stats.rooms.total} color="bg-emerald-500" />
            <StatusBar label="Занято" count={stats.rooms.occupied} total={stats.rooms.total} color="bg-blue-500" />
            <StatusBar label="Уборка" count={stats.rooms.cleaning} total={stats.rooms.total} color="bg-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-hotel-accent" /> Лидер рейтинга
          </h2>
          {stats.topEmployee ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl font-bold text-hotel-accent shadow-soft">
                {stats.topEmployee.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-lg text-slate-900">{stats.topEmployee.name}</p>
                <p className="text-slate-500 text-sm capitalize">{stats.topEmployee.role}</p>
                <p className="text-slate-800 font-semibold mt-1">{stats.topEmployee.points} баллов <span className="text-slate-400 font-normal">• Ур. {stats.topEmployee.level}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Нет данных</p>
          )}
        </div>
      </div>

      {stats.inventoryLow > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Низкий запас инвентаря</p>
            <p className="text-sm text-amber-800 mt-0.5">{stats.inventoryLow} позиций требуют пополнения.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, accent }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  };
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`${colors[accent]} text-white p-2.5 rounded-xl`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: any) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

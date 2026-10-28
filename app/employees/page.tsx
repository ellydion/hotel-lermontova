'use client';

import { useEffect, useState } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { Trophy, Star } from 'lucide-react';
import { PageHeader, Loading } from '@/components/AppShell';

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  receptionist: 'Ресепшен',
  housekeeping: 'Горничная',
  maintenance: 'Техник',
  manager: 'Менеджер',
};

function getLevelName(level: number) {
  if (level >= 5) return 'Легенда отеля';
  if (level >= 4) return 'Мастер сервиса';
  if (level >= 3) return 'Опытный сотрудник';
  if (level >= 2) return 'Стажёр+';
  return 'Новичок';
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('employees').select('*').order('points', { ascending: false });
      setEmployees(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Сотрудники" subtitle="Рейтинг и геймификация персонала" />

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {employees.map((emp, idx) => (
            <div key={emp.id} className={`card p-5 flex items-center gap-4 ${idx === 0 ? 'ring-2 ring-amber-400' : ''}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-navy-900 text-white font-bold text-lg relative">
                {emp.name.charAt(0)}
                {idx < 3 && <span className="absolute -top-1 -right-1 text-xs">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">{emp.name}</p>
                  {idx === 0 && <Trophy className="w-5 h-5 text-amber-500" />}
                </div>
                <p className="text-sm text-slate-500">{roleLabels[emp.role] || emp.role}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gold-600 font-bold">{emp.points} баллов</span>
                  <span className="text-sm text-slate-500">Уровень {emp.level} • {getLevelName(emp.level)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-medium">{Math.floor(emp.points / 100)}</span>
                </div>
                <p className="text-xs text-slate-400">значков</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

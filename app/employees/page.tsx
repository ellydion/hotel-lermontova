'use client';

import { useEffect, useState } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { Trophy, Star, ShieldCheck, UserPlus, Pencil } from 'lucide-react';
import EmployeeEditor from '@/components/EmployeeEditor';
import { PageHeader, Loading, useStaff } from '@/components/AppShell';
import { ROLES, roleLabels, roleSections, canManageRoles, StaffRole } from '@/lib/roles';

const sectionNames: Record<string, string> = {
  '/': 'Сегодня', '/rooms': 'Номера', '/bookings': 'Брони', '/guests': 'Гости',
  '/tasks': 'Задания', '/employees': 'Сотрудники', '/inventory': 'Инвентарь',
};

function getLevelName(level: number) {
  if (level >= 5) return 'Легенда отеля';
  if (level >= 4) return 'Мастер сервиса';
  if (level >= 3) return 'Опытный сотрудник';
  if (level >= 2) return 'Стажёр+';
  return 'Новичок';
}

export default function EmployeesPage() {
  const me = useStaff();
  const isAdmin = canManageRoles(me?.role);
  const isManager = me?.role === 'manager';
  const [editing, setEditing] = useState<{ emp: Employee; mode: 'admin' | 'manager' | 'self' } | null>(null);
  const modeFor = (emp: Employee) => isAdmin ? 'admin' as const : isManager && emp.role !== 'admin' ? 'manager' as const : emp.id === me?.id ? 'self' as const : null;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'housekeeping' as StaffRole });

  const load = async () => {
    const { data } = await supabase.from('employees').select('*').order('points', { ascending: false });
    setEmployees((data as Employee[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (emp: Employee, role: StaffRole) => {
    if (emp.id === me?.id && role !== 'admin') { setMsg('Нельзя снять роль администратора с самого себя'); return; }
    const { error } = await supabase.from('employees').update({ role }).eq('id', emp.id);
    setMsg(error ? `Ошибка: ${error.message}` : `${emp.name}: роль «${roleLabels[role]}»`);
    load();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('employees').insert({ name: form.name, email: form.email.trim().toLowerCase(), role: form.role });
    setMsg(error ? `Ошибка: ${error.message}` : `Добавлен(а) ${form.name}. Войти сможет после регистрации с этим email.`);
    setForm({ name: '', email: '', role: 'housekeeping' });
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Сотрудники" subtitle={isAdmin ? 'Роли и доступ персонала' : 'Рейтинг и геймификация персонала'} />
      {editing && <EmployeeEditor emp={editing.emp} mode={editing.mode} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); setMsg(m); load(); }} />}
      {me && !isAdmin && (
        <button onClick={() => { const self = employees.find((e) => e.id === me.id) || me; setEditing({ emp: self, mode: isManager ? 'manager' : 'self' }); }} className="card px-4 py-3 text-sm flex items-center gap-2 text-navy-900"><Pencil className="w-4 h-4" /> Мой профиль</button>
      )}
      {msg && <p className="card px-4 py-3 text-sm text-navy-900">{msg}</p>}

      {isAdmin && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-gold-600" /><h2 className="font-semibold text-navy-900">Управление ролями</h2></div>
            <div className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <div key={emp.id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center font-semibold">{emp.name.charAt(0)}</div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-medium text-navy-900">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.position ? `${emp.position} · ` : ''}{emp.email || 'нет email'} · {emp.auth_user_id ? 'вход привязан' : 'ещё не зарегистрирован'}{emp.is_active === false ? ' · отключён' : ''}</p>
                  </div>
                  <select value={emp.role} onChange={(e) => changeRole(emp, e.target.value as StaffRole)} className="input w-auto py-2 text-sm">
                    {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                  </select>
                  <button onClick={() => setEditing({ emp, mode: 'admin' })} className="p-2 rounded-lg border border-slate-200" aria-label="Редактировать профиль"><Pencil className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <form onSubmit={add} className="card p-5 space-y-3">
              <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-gold-600" /><h2 className="font-semibold text-navy-900">Новый сотрудник</h2></div>
              <input className="input" placeholder="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" type="email" placeholder="Email для входа" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
                {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
              <button className="btn-primary w-full py-2.5">Добавить</button>
            </form>
            <div className="card p-5">
              <h2 className="font-semibold text-navy-900 mb-3">Что видит каждая роль</h2>
              <div className="space-y-2.5 text-sm">
                {ROLES.map((r) => (
                  <div key={r}>
                    <p className="font-medium text-navy-900">{roleLabels[r]}</p>
                    <p className="text-xs text-slate-500">{roleSections[r].map((s) => sectionNames[s]).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="font-semibold text-navy-900">Рейтинг</h2>
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
                <p className="text-sm text-slate-500">{emp.position || roleLabels[emp.role] || emp.role}{emp.is_active === false ? ' · отключён' : ''}</p>
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
                {!isAdmin && modeFor(emp) && modeFor(emp) !== 'self' && (
                  <button onClick={() => setEditing({ emp, mode: modeFor(emp)! })} className="mt-2 text-xs text-gold-600 inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Изменить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

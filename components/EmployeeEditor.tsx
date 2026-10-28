'use client';

import { useState } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { ROLES, roleLabels, StaffRole } from '@/lib/roles';

type Mode = 'admin' | 'manager' | 'self';

// admin — всё; manager — всё, кроме роли (и не трогает профиль admin); self — только контакты.
export default function EmployeeEditor({ emp, mode, onClose, onSaved }: {
  emp: Employee; mode: Mode; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [f, setF] = useState({
    name: emp.name, email: emp.email ?? '', phone: emp.phone ?? '', position: emp.position ?? '',
    avatar_url: emp.avatar_url ?? '', role: emp.role as StaffRole, is_active: emp.is_active !== false,
    points: emp.points, level: emp.level,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const staffField = mode !== 'self';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const patch: Record<string, unknown> = { name: f.name.trim(), phone: f.phone.trim() || null, avatar_url: f.avatar_url.trim() || null };
    if (staffField) Object.assign(patch, {
      email: f.email.trim().toLowerCase() || null, position: f.position.trim() || null,
      is_active: f.is_active, points: Number(f.points) || 0, level: Number(f.level) || 1,
    });
    if (mode === 'admin') patch.role = f.role;
    const { error } = await supabase.from('employees').update(patch).eq('id', emp.id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved(`Профиль «${patch.name}» сохранён`);
  };

  const field = (label: string, el: React.ReactNode) => (
    <label className="block text-sm"><span className="text-slate-500 text-xs">{label}</span>{el}</label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-navy-900">{mode === 'self' ? 'Мой профиль' : `Профиль: ${emp.name}`}</h2>
        {field('Имя', <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />)}
        {field('Телефон', <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+996 …" />)}
        {field('Фото (ссылка)', <input className="input" value={f.avatar_url} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} />)}
        {staffField && <>
          {field('Email для входа', <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />)}
          {field('Должность', <input className="input" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} placeholder="напр. Старшая горничная" />)}
          {field('Роль (доступ)', mode === 'admin'
            ? <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StaffRole })}>{ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}</select>
            : <p className="input bg-slate-50">{roleLabels[f.role]} <span className="text-xs text-slate-400">(меняет администратор)</span></p>)}
          <div className="grid grid-cols-2 gap-3">
            {field('Баллы', <input className="input" type="number" min={0} value={f.points} onChange={(e) => setF({ ...f, points: Number(e.target.value) })} />)}
            {field('Уровень', <input className="input" type="number" min={1} value={f.level} onChange={(e) => setF({ ...f, level: Number(e.target.value) })} />)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Активен (снимите — доступ закроется)</label>
        </>}
        {mode === 'self' && <p className="text-xs text-slate-500">Email, должность и роль меняет администратор или менеджер.</p>}
        {err && <p className="text-sm text-red-600">Ошибка: {err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200">Отмена</button>
          <button disabled={busy} className="btn-primary flex-1 py-2.5">{busy ? 'Сохраняю…' : 'Сохранить'}</button>
        </div>
      </form>
    </div>
  );
}

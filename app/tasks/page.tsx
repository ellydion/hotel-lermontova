'use client';

import { useEffect, useState } from 'react';
import { supabase, Task, Employee, Room } from '@/lib/supabase';
import { CheckCircle, Clock, Play, Plus, ClipboardList, X } from 'lucide-react';
import { PageHeader, Loading, useStaff } from '@/components/AppShell';
import { roleTaskTypes } from '@/lib/roles';

const typeLabels: Record<string, string> = {
  cleaning: 'Уборка',
  checkin: 'Заселение',
  checkout: 'Выселение',
  maintenance: 'Ремонт',
  inventory: 'Инвентарь',
  other: 'Другое',
  daily: 'Ежедневное',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  in_progress: Play,
  completed: CheckCircle,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const me = useStaff();
  const types = me ? roleTaskTypes[me.role] : null;
  const limited = !!types;
  const canCreate = me?.role === 'admin' || me?.role === 'manager'; // RLS tasks_insert: is_manager()
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');
  const blank = { title: '', description: '', type: 'cleaning', room_id: '', employee_id: '', points: '10' };
  const [form, setForm] = useState(blank); // горничная / техник: только свои типы заданий, без назначения других

  const load = async () => {
    setLoading(true);
    const [tasksRes, empRes, roomsRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*'),
      supabase.from('rooms').select('*').order('number'),
    ]);
    setRooms(((roomsRes as any).data as Room[]) || []);
    setTasks(((tasksRes.data as Task[]) || []).filter((t) => !types || types.includes(t.type)));
    setEmployees((empRes.data as Employee[]) || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [me?.role]);

  const completeTask = async (task: Task) => {
    if (!task.employee_id) {
      alert('Сначала назначьте сотрудника');
      return;
    }
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
    // баллы сотруднику начисляет триггер tasks_award_points в базе (миграция 2026-10-28)
    load();
  };

  const assign = async (taskId: string, employeeId: string) => {
    await supabase.from('tasks').update({ employee_id: employeeId, status: 'in_progress' }).eq('id', taskId);
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tasks').insert({
      title: form.title.trim(), description: form.description.trim() || null, type: form.type,
      room_id: form.room_id || null, employee_id: form.employee_id || null,
      status: form.employee_id ? 'in_progress' : 'pending', points: Number(form.points) || 0,
    });
    if (error) { setErr(error.message); return; }
    setForm(blank); setShowForm(false); load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title={me?.role === 'housekeeping' ? 'Уборка' : me?.role === 'maintenance' ? 'Ремонт' : 'Задания'}
        subtitle={limited ? 'Ваши задания и свободные задачи — берите и отмечайте выполненными' : 'Выполняйте задания и получайте баллы'}
        action={canCreate ? <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Создать задание</button> : undefined} />

      {showForm && (
        <form onSubmit={create} className="card p-5 space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-navy-900">Новое задание</h2>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Закрыть"><X className="w-5 h-5 text-slate-400" /></button></div>
          <input className="input" placeholder="Что сделать, напр. «Уборка номера 301»" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="input" rows={2} placeholder="Подробности (необязательно)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
              <option value="">Без номера</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>Номер {r.number}</option>)}
            </select>
            <select className="input" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">Не назначено</option>
              {employees.filter((e) => e.is_active !== false).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input className="input" type="number" min={0} placeholder="Баллы" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
          </div>
          {err && <p className="text-sm text-red-600">Ошибка: {err}</p>}
          <button className="btn-primary w-full sm:w-auto">Создать</button>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {!tasks.length && (
            <div className="card p-10 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-navy-900 mt-3">Заданий пока нет</p>
              <p className="text-sm text-slate-500 mt-1">{canCreate ? 'Создайте первое задание — уборку, ремонт или заселение — и назначьте сотрудника.' : 'Когда администратор или менеджер создаст задание, оно появится здесь.'}</p>
              {canCreate && <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto"><Plus className="w-4 h-4" />Создать задание</button>}
            </div>
          )}
          {tasks.map(task => {
            const StatusIcon = statusIcons[task.status];
            const emp = employees.find(e => e.id === task.employee_id);
            return (
              <div key={task.id} className="card p-5">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusIcon className={`w-5 h-5 ${task.status === 'completed' ? 'text-emerald-500' : task.status === 'in_progress' ? 'text-blue-500' : 'text-slate-400'}`} />
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{typeLabels[task.type]}</span>
                    </div>
                    {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
                    <p className="text-gold-600 font-medium mt-2">+{task.points} баллов</p>
                    {emp && <p className="text-sm text-slate-500 mt-1">Исполнитель: {emp.name}</p>}
                  </div>
                  <div className="flex flex-row sm:flex-col flex-wrap items-center sm:items-end gap-2 w-full sm:w-auto">
                    {task.status !== 'completed' && (
                      <>
                        {limited ? (
                          !task.employee_id && me && <button onClick={() => assign(task.id, me.id)} className="px-4 py-1.5 border border-slate-200 text-sm rounded-xl">Взять себе</button>
                        ) : <select className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white" value={task.employee_id || ''} onChange={(e) => e.target.value && assign(task.id, e.target.value)}>
                          <option value="">Назначить</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>}
                        <button onClick={() => completeTask(task)} className="px-4 py-1.5 bg-navy-900 text-white text-sm rounded-xl hover:bg-navy-800">Завершить</button>
                      </>
                    )}
                    {task.status === 'completed' && <span className="text-emerald-600 text-sm font-medium">Выполнено</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

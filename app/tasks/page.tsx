'use client';

import { useEffect, useState } from 'react';
import { supabase, Task, Employee } from '@/lib/supabase';
import { CheckCircle, Clock, Play } from 'lucide-react';

const typeLabels: Record<string, string> = {
  cleaning: 'Уборка',
  checkin: 'Заселение',
  checkout: 'Выселение',
  maintenance: 'Ремонт',
  inventory: 'Инвентарь',
  other: 'Другое',
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

  const load = async () => {
    setLoading(true);
    const [tasksRes, empRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*'),
    ]);
    setTasks(tasksRes.data || []);
    setEmployees((empRes.data as Employee[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const completeTask = async (task: Task) => {
    if (!task.employee_id) {
      alert('Сначала назначьте сотрудника');
      return;
    }
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
    const emp = employees.find(e => e.id === task.employee_id);
    if (emp) {
      const newPoints = emp.points + task.points;
      const newLevel = Math.floor(newPoints / 100) + 1;
      await supabase.from('employees').update({ points: newPoints, level: newLevel }).eq('id', emp.id);
    }
    load();
  };

  const assign = async (taskId: string, employeeId: string) => {
    await supabase.from('tasks').update({ employee_id: employeeId, status: 'in_progress' }).eq('id', taskId);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-hotel-900">Задания и геймификация</h1>
        <p className="text-slate-600">Выполняйте задания и получайте баллы</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const StatusIcon = statusIcons[task.status];
            const emp = employees.find(e => e.id === task.employee_id);
            return (
              <div key={task.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-5 h-5 ${task.status === 'completed' ? 'text-emerald-500' : task.status === 'in_progress' ? 'text-blue-500' : 'text-slate-400'}`} />
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{typeLabels[task.type]}</span>
                    </div>
                    {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
                    <p className="text-hotel-600 font-medium mt-2">+{task.points} баллов</p>
                    {emp && <p className="text-sm text-slate-500 mt-1">Исполнитель: {emp.name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {task.status !== 'completed' && (
                      <>
                        <select className="text-sm border rounded px-2 py-1" value={task.employee_id || ''} onChange={(e) => e.target.value && assign(task.id, e.target.value)}>
                          <option value="">Назначить</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <button onClick={() => completeTask(task)} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">Завершить</button>
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

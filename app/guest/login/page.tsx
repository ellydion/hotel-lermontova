'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hotel } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GuestLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    if (mode === 'up') {
      // Запись в guests создаёт триггер в базе по метаданным account=guest (см. миграцию).
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { data: { account: 'guest', name: f.name, phone: f.phone } },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg('Проверьте почту и подтвердите регистрацию, затем войдите.');
      else router.push('/guest');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) setMsg(error.message); else router.push('/guest');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center"><Hotel className="w-6 h-6" /></div>
          <p className="text-lg font-semibold text-navy-900">Отель Лермонтова</p>
        </div>
        <form onSubmit={submit} className="card p-7 space-y-3">
          <h1 className="text-2xl font-bold text-navy-900">{mode === 'up' ? 'Регистрация гостя' : 'Личный кабинет гостя'}</h1>
          <p className="text-sm text-slate-500 mb-2">Брони и бонусные баллы за проживание</p>
          {mode === 'up' && <>
            <input className="input" placeholder="Имя и фамилия" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
            <input className="input" placeholder="Телефон" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </>}
          <input className="input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Пароль" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} />
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Подождите…' : mode === 'up' ? 'Зарегистрироваться' : 'Войти'}</button>
          {msg && <p className="text-sm text-center text-slate-600">{msg}</p>}
          <button type="button" onClick={() => setMode(mode === 'up' ? 'in' : 'up')} className="w-full text-sm text-gold-600 hover:underline">
            {mode === 'up' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6"><Link href="/login" className="hover:underline">Вход для сотрудников</Link></p>
      </div>
    </div>
  );
}

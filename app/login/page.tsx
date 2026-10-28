'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else {
      setMessage(isSignUp ? 'Проверьте почту для подтверждения' : 'Успешный вход');
      if (!isSignUp) router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-400 text-navy-900 flex items-center justify-center"><Hotel className="w-6 h-6" /></div>
          <p className="text-lg font-semibold">Отель Лермонтова</p>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Заезды, номера и брони —<br />в одном окне</h2>
          <p className="text-white/60 mt-4 max-w-md">Рабочее место администратора: статусы номеров, заселение и выезд, задания для персонала.</p>
        </div>
        <p className="text-xs text-white/40">Только для сотрудников отеля</p>
      </div>
      <div className="flex items-center justify-center p-6 bg-[#f3f4f7]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center"><Hotel className="w-6 h-6" /></div>
            <p className="text-lg font-semibold text-navy-900">Отель Лермонтова</p>
          </div>
          <div className="card p-7">
            <h1 className="text-2xl font-bold text-navy-900">{isSignUp ? 'Регистрация' : 'Вход'}</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">{isSignUp ? 'Создайте учётную запись сотрудника' : 'Войдите в учётную запись сотрудника'}</p>
            <form onSubmit={handleAuth} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Email</span>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="name@example.com" required />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Пароль</span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" placeholder="••••••••" required />
                </div>
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Подождите…' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </form>
            {message && <p className="mt-4 text-center text-sm text-slate-600">{message}</p>}
            <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-5 text-sm text-gold-600 hover:underline">
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

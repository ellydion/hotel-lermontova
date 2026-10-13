'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(isSignUp ? 'Проверьте почту для подтверждения' : 'Успешный вход');
      if (!isSignUp) router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-hotel-900">
          {isSignUp ? 'Регистрация' : 'Вход'} в Отель Лермонтова
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-2" required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-4 py-2" required />
          <button type="submit" disabled={loading} className="w-full bg-hotel-600 text-white py-2 rounded-lg hover:bg-hotel-700 disabled:opacity-50">
            {loading ? '...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-slate-600">{message}</p>}
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-sm text-hotel-600 hover:underline">
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Users, Package, Trophy, LayoutDashboard, Calendar, LogOut, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const links = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/rooms', label: 'Номера', icon: Building2 },
  { href: '/bookings', label: 'Брони', icon: Calendar },
  { href: '/employees', label: 'Сотрудники', icon: Users },
  { href: '/inventory', label: 'Инвентарь', icon: Package },
  { href: '/tasks', label: 'Задания', icon: Trophy },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <nav className="bg-hotel-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Отель Лермонтова
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-hotel-900 text-white'
                      : 'text-hotel-100 hover:bg-hotel-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <button onClick={logout} className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-hotel-600 rounded-lg">
                <LogOut className="w-4 h-4" /> Выйти
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-hotel-600 rounded-lg">
                <LogIn className="w-4 h-4" /> Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
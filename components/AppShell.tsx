'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sun, BedDouble, CalendarDays, Users, Package, ListChecks, LogOut, Menu, X, Hotel,
} from 'lucide-react';
import { supabase, isDemo } from '@/lib/supabase';

const main = [
  { href: '/', label: 'Сегодня', icon: Sun },
  { href: '/rooms', label: 'Номера', icon: BedDouble },
  { href: '/bookings', label: 'Брони', icon: CalendarDays },
];
const extra = [
  { href: '/tasks', label: 'Задания', icon: ListChecks },
  { href: '/employees', label: 'Сотрудники', icon: Users },
  { href: '/inventory', label: 'Инвентарь', icon: Package },
];

const isActive = (p: string, href: string) => (href === '/' ? p === '/' : p.startsWith(href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname === '/login') return <>{children}</>;

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-navy-900 text-white print:hidden">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gold-400 text-navy-900 flex items-center justify-center"><Hotel className="w-5 h-5" /></div>
          <div>
            <p className="font-semibold leading-tight">Отель Лермонтова</p>
            <p className="text-xs text-white/50">Управление отелем</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {[...main, ...extra].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                isActive(pathname, href) ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          {email && <p className="text-xs text-white/50 truncate mb-2 px-2">{email}</p>}
          {email ? (
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5">
              <LogOut className="w-5 h-5" /> Выйти
            </button>
          ) : (
            <Link href="/login" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5">Войти</Link>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-navy-900 text-white px-4 h-14 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 font-semibold"><Hotel className="w-5 h-5 text-gold-400" /> Отель Лермонтова</div>
        {email ? (
          <button onClick={logout} aria-label="Выйти" className="p-2 -mr-2 text-white/70"><LogOut className="w-5 h-5" /></button>
        ) : (
          <Link href="/login" className="text-sm text-white/80">Войти</Link>
        )}
      </header>

      {isDemo && (
        <div className="bg-gold-100 text-navy-900 text-xs text-center py-1 print:hidden">Демо-режим (только локально): данные вымышленные</div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8 pb-28 lg:pb-10">{children}</main>

      {/* Mobile bottom tabs */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-4 pb-[env(safe-area-inset-bottom)] print:hidden">
        {main.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive(pathname, href) ? 'text-navy-900' : 'text-slate-400'}`}>
            <Icon className="w-6 h-6" /> {label}
          </Link>
        ))}
        <button onClick={() => setMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${extra.some((e) => isActive(pathname, e.href)) ? 'text-navy-900' : 'text-slate-400'}`}>
          <Menu className="w-6 h-6" /> Меню
        </button>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-navy-900">Меню</p>
              <button onClick={() => setMenuOpen(false)} aria-label="Закрыть"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {extra.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-900 hover:bg-slate-50">
                <Icon className="w-5 h-5 text-slate-500" /> {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, crumbs }: {
  title: string; subtitle?: string; action?: React.ReactNode; crumbs?: { href?: string; label: string }[];
}) {
  return (
    <div className="mb-6">
      {crumbs && (
        <nav className="text-xs text-slate-500 mb-2 flex flex-wrap gap-1">
          {crumbs.map((c, i) => (
            <span key={i} className="flex gap-1">
              {c.href ? <Link href={c.href} className="hover:text-navy-900">{c.label}</Link> : <span className="text-navy-900">{c.label}</span>}
              {i < crumbs.length - 1 && <span>›</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-navy-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="py-16 text-center text-slate-400 text-sm">Загрузка…</div>;
}

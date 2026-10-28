'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  Sun, BedDouble, CalendarDays, Users, Package, ListChecks, LogOut, Menu, X, Hotel, ShieldX, Heart,
} from 'lucide-react';
import { supabase, isDemo, Employee } from '@/lib/supabase';
import { canAccess, homeFor, roleLabels, roleSections } from '@/lib/roles';

// Текущий сотрудник (по auth_user_id) — доступен страницам через useStaff().
const StaffContext = createContext<Employee | null>(null);
export const useStaff = () => useContext(StaffContext);

const PUBLIC = (p: string) => p === '/login' || p === '/guest' || p.startsWith('/guest/'); // НЕ '/guests' — это раздел персонала

const main = [
  { href: '/', label: 'Сегодня', icon: Sun },
  { href: '/rooms', label: 'Номера', icon: BedDouble },
  { href: '/bookings', label: 'Брони', icon: CalendarDays },
  { href: '/guests', label: 'Гости', icon: Heart },
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
  const [staff, setStaff] = useState<Employee | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'unlinked'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);

  // Охрана маршрутов: без входа → /login; гость → /guest; не привязан к сотруднику → нет доступа.
  useEffect(() => {
    if (PUBLIC(pathname)) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!alive) return;
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? null);
      const { data: emp } = await supabase.from('employees').select('*').eq('auth_user_id', user.id).maybeSingle();
      if (!alive) return;
      if (emp) { setStaff(emp as Employee); setState('ok'); return; }
      const { data: g } = await supabase.from('guests').select('*').eq('auth_user_id', user.id).maybeSingle();
      if (!alive) return;
      if (g) { router.replace('/guest'); return; }
      setState('unlinked');
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s?.user && !PUBLIC(window.location.pathname)) router.replace('/login');
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [pathname, router]);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (staff && pathname === '/' && !canAccess(staff.role, '/')) router.replace(homeFor(staff.role));
  }, [staff, pathname, router]);

  if (PUBLIC(pathname)) return <>{children}</>;
  if (state === 'loading') return <Loading />;

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const all = [...main, ...extra];
  const ordered = staff ? roleSections[staff.role].map((h) => all.find((m) => m.href === h)!).filter(Boolean) : [];
  const mainNav = ordered.slice(0, 3);
  const extraNav = ordered.slice(3);
  const content = state === 'unlinked'
    ? <NoAccess text="Учётная запись не привязана к сотруднику. Обратитесь к администратору." onLogout={logout} />
    : staff && !canAccess(staff.role, pathname)
      ? (pathname === '/' ? <Loading /> : <NoAccess text={`Раздел недоступен для роли «${roleLabels[staff.role]}».`} home={homeFor(staff.role)} />)
      : children;

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
          {ordered.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                isActive(pathname, href) ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          {staff && <p className="text-xs text-gold-400 mb-1 px-2">{staff.name} · {roleLabels[staff.role]}</p>}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8 pb-28 lg:pb-10">
        <StaffContext.Provider value={staff}>{content}</StaffContext.Provider>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-4 pb-[env(safe-area-inset-bottom)] print:hidden">
        {mainNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive(pathname, href) ? 'text-navy-900' : 'text-slate-400'}`}>
            <Icon className="w-6 h-6" /> {label}
          </Link>
        ))}
        {extraNav.length > 0 && <button onClick={() => setMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${extraNav.some((e) => isActive(pathname, e.href)) ? 'text-navy-900' : 'text-slate-400'}`}>
          <Menu className="w-6 h-6" /> Меню
        </button>}
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-navy-900">Меню</p>
              <button onClick={() => setMenuOpen(false)} aria-label="Закрыть"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {extraNav.map(({ href, label, icon: Icon }) => (
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

function NoAccess({ text, home, onLogout }: { text: string; home?: string; onLogout?: () => void }) {
  return (
    <div className="card max-w-md mx-auto mt-10 p-8 text-center">
      <ShieldX className="w-12 h-12 text-red-500 mx-auto" />
      <h1 className="text-xl font-bold text-navy-900 mt-4">Нет доступа</h1>
      <p className="text-sm text-slate-500 mt-2">{text}</p>
      {home && <Link href={home} className="btn-primary mt-6 inline-flex px-5 py-2.5">На мою страницу</Link>}
      {onLogout && <button onClick={onLogout} className="btn-primary mt-6 px-5 py-2.5">Выйти</button>}
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

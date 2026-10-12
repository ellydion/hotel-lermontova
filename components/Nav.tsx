'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Package, Trophy, LayoutDashboard } from 'lucide-react';

const links = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/rooms', label: 'Номера', icon: Building2 },
  { href: '/employees', label: 'Сотрудники', icon: Users },
  { href: '/inventory', label: 'Инвентарь', icon: Package },
  { href: '/tasks', label: 'Задания', icon: Trophy },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-hotel-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Отель Лермонтова
          </Link>
          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
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
          </div>
        </div>
      </div>
    </nav>
  );
}

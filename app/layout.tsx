import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Отель Лермонтова',
  description: 'Система управления отелем: номера, сотрудники, инвентарь и геймификация',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Nav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

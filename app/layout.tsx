import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Отель Лермонтова',
  description: 'Система управления отелем: номера, брони, сотрудники, инвентарь и задания',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f2a44' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

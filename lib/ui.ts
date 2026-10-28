export const roomStatus: Record<string, { label: string; dot: string; card: string; text: string }> = {
  available: { label: 'Свободен', dot: 'bg-emerald-500', card: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  occupied: { label: 'Занят', dot: 'bg-blue-500', card: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  cleaning: { label: 'Уборка', dot: 'bg-amber-400', card: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  maintenance: { label: 'Ремонт', dot: 'bg-red-500', card: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export const bookingStatus: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Подтверждена', cls: 'bg-violet-100 text-violet-700' },
  checked_in: { label: 'Проживает', cls: 'bg-blue-100 text-blue-700' },
  checked_out: { label: 'Выехал', cls: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Отменена', cls: 'bg-red-100 text-red-700' },
};

export const roomType: Record<string, string> = {
  standard: 'Стандарт', lux: 'Люкс', family_lux: 'Семейный люкс', penta_lux: 'Пента-люкс',
  // устаревшие типы (не используются)
  deluxe: 'Делюкс (устар.)', suite: 'Сюит (устар.)', family: 'Семейный (устар.)',
};

export const todayISO = () => {
  const t = new Date();
  return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const fmtDate = (s?: string | null) =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';

export const fmtMoney = (n: number) => Math.round(n).toLocaleString("ru-RU");

export const nights = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

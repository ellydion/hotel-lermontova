'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Phone, Mail, LogIn, LogOut, Printer, XCircle, BedDouble, CalendarDays, StickyNote } from 'lucide-react';
import { awardStayPoints } from '@/lib/loyalty';
import { supabase, Booking, Room } from '@/lib/supabase';
import { PageHeader, Loading } from '@/components/AppShell';
import { bookingStatus, fmtMoney, initials, nights, roomType } from '@/lib/ui';

const long = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('bookings').select('*').eq('id', id).single();
    setB(data as Booking | null);
    if (data?.room_id) {
      const r = await supabase.from('rooms').select('*').eq('id', data.room_id).single();
      setRoom(r.data as Room | null);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: string) => {
    if (!b) return;
    setBusy(true);
    await supabase.from('bookings').update({ status }).eq('id', b.id);
    if (status === 'checked_out') await awardStayPoints(b.id);
    await load();
    setBusy(false);
  };

  if (loading) return <Loading />;
  if (!b) return <div className="card p-10 text-center text-slate-500">Бронь не найдена</div>;

  const st = bookingStatus[b.status] || { label: b.status, cls: 'bg-slate-100 text-slate-600' };
  const n = nights(b.check_in, b.check_out);
  const total = room ? n * Number(room.price_per_night) : null;

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title={b.guest_name} crumbs={[{ href: '/bookings', label: 'Брони' }, { label: b.guest_name }]}
          action={<span className={`chip ${st.cls}`}>{st.label}</span>} />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_280px] gap-5 print:hidden">
        {/* Guest */}
        <aside className="rounded-2xl bg-navy-900 text-white p-6 h-fit">
          <div className="flex lg:flex-col items-center gap-4 lg:text-center">
            <span className="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-gold-400 text-navy-900 text-xl lg:text-3xl font-bold flex items-center justify-center">{initials(b.guest_name)}</span>
            <div>
              <p className="text-lg font-semibold">{b.guest_name}</p>
              <p className="text-xs text-white/50">Гость</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {b.guest_phone && <a href={`tel:${b.guest_phone}`} className="flex items-center gap-3 text-white/80 hover:text-white"><Phone className="w-4 h-4 text-gold-400" />{b.guest_phone}</a>}
            {b.guest_email && <a href={`mailto:${b.guest_email}`} className="flex items-center gap-3 text-white/80 hover:text-white break-all"><Mail className="w-4 h-4 text-gold-400 shrink-0" />{b.guest_email}</a>}
            {!b.guest_phone && !b.guest_email && <p className="text-white/40">Контакты не указаны</p>}
          </div>
        </aside>

        {/* Reservation */}
        <section className="space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold text-navy-900 mb-4">Бронирование</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
              <div><dt className="text-xs text-slate-500 flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />Номер</dt><dd className="font-semibold mt-1">{room?.number || '—'}{room && <span className="font-normal text-slate-500"> · {roomType[room.type] || room.type}</span>}</dd></div>
              <div><dt className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Заезд</dt><dd className="font-semibold mt-1">{long(b.check_in)}</dd></div>
              <div><dt className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Выезд</dt><dd className="font-semibold mt-1">{long(b.check_out)}</dd></div>
              <div><dt className="text-xs text-slate-500">Ночей</dt><dd className="font-semibold mt-1">{n}</dd></div>
              {room && <div><dt className="text-xs text-slate-500">Вместимость</dt><dd className="font-semibold mt-1">{room.capacity}</dd></div>}
              {room?.floor != null && <div><dt className="text-xs text-slate-500">Этаж</dt><dd className="font-semibold mt-1">{room.floor}</dd></div>}
            </dl>
            {b.notes && <p className="mt-5 text-sm bg-gold-50 rounded-xl p-3 flex gap-2"><StickyNote className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />{b.notes}</p>}
          </div>

          {room && (
            <div className="card overflow-hidden">
              <h2 className="font-semibold text-navy-900 p-6 pb-3">Расчёт по тарифу номера</h2>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-6 py-2 font-medium">Позиция</th><th className="text-right px-3 py-2 font-medium">Кол-во</th><th className="text-right px-3 py-2 font-medium">Цена</th><th className="text-right px-6 py-2 font-medium">Сумма</th></tr></thead>
                <tbody>
                  <tr className="border-t border-slate-100"><td className="px-6 py-3">Проживание, номер {room.number}</td><td className="text-right px-3">{n}</td><td className="text-right px-3">{fmtMoney(room.price_per_night)}</td><td className="text-right px-6">{fmtMoney(total!)}</td></tr>
                </tbody>
                <tfoot><tr className="border-t border-slate-200 font-semibold"><td className="px-6 py-3" colSpan={3}>Итого</td><td className="text-right px-6">{fmtMoney(total!)}</td></tr></tfoot>
              </table>
              <p className="px-6 pb-4 text-xs text-slate-400">Оценка: ночи × цена номера. Оплаты в системе не хранятся.</p>
            </div>
          )}
        </section>

        {/* Actions */}
        <aside className="rounded-2xl bg-gold-50 border border-gold-200 p-5 h-fit space-y-3">
          <h2 className="font-semibold text-navy-900">Действия</h2>
          {b.status === 'confirmed' && <button disabled={busy} onClick={() => updateStatus('checked_in')} className="btn-primary w-full py-3"><LogIn className="w-4 h-4" />Заселить</button>}
          {b.status === 'checked_in' && <button disabled={busy} onClick={() => updateStatus('checked_out')} className="btn-primary w-full py-3"><LogOut className="w-4 h-4" />Выселить</button>}
          <button onClick={() => window.print()} className="btn-ghost w-full"><Printer className="w-4 h-4" />Печать регистрационной карты</button>
          {b.status === 'confirmed' && (
            <button disabled={busy} onClick={() => confirm('Отменить бронь?') && updateStatus('cancelled')} className="btn w-full text-red-600 hover:bg-red-50"><XCircle className="w-4 h-4" />Отменить бронь</button>
          )}
        </aside>
      </div>

      {/* Print-only registration card */}
      <div className="hidden print:block text-black text-sm">
        <h1 className="text-xl font-bold">Отель Лермонтова — регистрационная карта гостя</h1>
        <table className="mt-6 w-full border-collapse [&_td]:border [&_td]:border-black [&_td]:p-2">
          <tbody>
            <tr><td className="w-1/3">Гость</td><td>{b.guest_name}</td></tr>
            <tr><td>Телефон</td><td>{b.guest_phone || ''}</td></tr>
            <tr><td>Email</td><td>{b.guest_email || ''}</td></tr>
            <tr><td>Номер</td><td>{room?.number || ''}</td></tr>
            <tr><td>Заезд</td><td>{long(b.check_in)}</td></tr>
            <tr><td>Выезд</td><td>{long(b.check_out)}</td></tr>
            <tr><td>Ночей</td><td>{n}</td></tr>
            <tr><td>Документ (серия, номер)</td><td>&nbsp;</td></tr>
            <tr><td>Адрес проживания</td><td>&nbsp;</td></tr>
          </tbody>
        </table>
        <p className="mt-12">Подпись гостя: ______________________ &nbsp;&nbsp; Дата: ____________</p>
      </div>
    </div>
  );
}

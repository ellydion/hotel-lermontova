'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, Users } from 'lucide-react';
import { supabase, Room, Booking } from '@/lib/supabase';
import { PageHeader, Loading } from '@/components/AppShell';
import { roomStatus, roomType, fmtMoney, fmtDate } from '@/lib/ui';

function RoomsBoard() {
  const params = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stays, setStays] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(params.get('s') || 'all');
  const [floor, setFloor] = useState('all');

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([
      supabase.from('rooms').select('*').order('number'),
      supabase.from('bookings').select('*').eq('status', 'checked_in'),
    ]);
    setRooms((r.data as Room[]) || []);
    setStays((b.data as Booking[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('rooms').update({ status }).eq('id', id);
    load();
  };

  const floors = Array.from(new Set(rooms.map((r) => r.floor).filter((f) => f != null))).sort((a, b) => Number(a) - Number(b));
  const filtered = rooms.filter((r) => (filter === 'all' || r.status === filter) && (floor === 'all' || String(r.floor) === floor));
  const pill = (active: boolean) => `px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${active ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`;

  return (
    <div>
      <PageHeader title="Номера" subtitle={`${rooms.length} номеров · свободно ${rooms.filter((r) => r.status === 'available').length}`}
        action={<button onClick={load} className="btn-ghost"><RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Обновить</span></button>} />

      <div className="card p-4 mb-5 space-y-3">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          <button onClick={() => setFloor('all')} className={pill(floor === 'all')}>Все этажи</button>
          {floors.map((f) => <button key={String(f)} onClick={() => setFloor(String(f))} className={pill(floor === String(f))}>Этаж {f}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(roomStatus).map(([key, s]) => (
            <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`chip border ${filter === key ? 'border-navy-900 bg-white' : 'border-transparent bg-slate-50'} text-slate-700`}>
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} /> {s.label}
              <span className="text-slate-400">{rooms.filter((r) => r.status === key).length}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {filtered.length === 0 && <p className="col-span-full text-center text-slate-400 py-10 text-sm">Нет номеров по фильтру</p>}
          {filtered.map((room) => {
            const s = roomStatus[room.status] || roomStatus.available;
            const stay = stays.find((b) => b.room_id === room.id);
            return (
              <div key={room.id} className={`rounded-2xl border p-4 flex flex-col gap-2 ${s.card}`}>
                <div className="flex items-start justify-between">
                  <p className="text-2xl font-bold text-navy-900">{room.number}</p>
                  <span className={`chip bg-white/70 ${s.text}`}><span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}</span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  {roomType[room.type] || room.type}
                  <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{room.capacity}</span>
                  <span>· {fmtMoney(room.price_per_night)}/ночь</span>
                </p>
                {stay ? (
                  <Link href={`/bookings/${stay.id}`} className="text-sm font-medium text-navy-900 truncate hover:underline">
                    {stay.guest_name}<span className="block text-xs font-normal text-slate-500">до {fmtDate(stay.check_out)}</span>
                  </Link>
                ) : <span className="text-sm text-slate-400">—</span>}
                <select value={room.status} onChange={(e) => updateStatus(room.id, e.target.value)}
                  className="mt-auto text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5" aria-label="Статус номера">
                  {Object.entries(roomStatus).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoomsPage() {
  return <Suspense fallback={<Loading />}><RoomsBoard /></Suspense>;
}

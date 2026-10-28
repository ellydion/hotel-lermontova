'use client';

import { useEffect, useState } from 'react';
import { Heart, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, Loading, useStaff } from '@/components/AppShell';
import { Guest, LoyaltyTx, adjustPoints, reasonLabel, LOYALTY_PERCENT } from '@/lib/loyalty';
import { canAdjustPoints } from '@/lib/roles';

const fmt = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function GuestsPage() {
  const me = useStaff();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [sel, setSel] = useState<Guest | null>(null);
  const [tx, setTx] = useState<LoyaltyTx[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');

  const load = async (keep?: string) => {
    const { data } = await supabase.from('guests').select('*').order('points', { ascending: false });
    const list = (data as Guest[]) || [];
    setGuests(list);
    setLoading(false);
    const s = list.find((g) => g.id === keep) || null;
    setSel(s);
    if (s) {
      const t = await supabase.from('loyalty_transactions').select('*').eq('guest_id', s.id).order('created_at', { ascending: false });
      setTx((t.data as LoyaltyTx[]) || []);
    }
  };
  useEffect(() => { load(); }, []);

  const apply = async (sign: 1 | -1) => {
    if (!sel || !me) return;
    const n = Math.abs(parseInt(delta, 10));
    if (!n || !reason.trim()) { setMsg('Укажите количество баллов и причину'); return; }
    if (sign < 0 && n > sel.points) { setMsg('Нельзя списать больше, чем на балансе'); return; }
    const { error } = await adjustPoints(sel.id, sign * n, reason.trim(), me.id);
    setMsg(error ? `Ошибка: ${error}` : 'Готово');
    setDelta(''); setReason('');
    load(sel.id);
  };

  const shown = guests.filter((g) => (g.name + ' ' + (g.email || '') + ' ' + (g.phone || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader title="Гости" subtitle={`Программа лояльности: ${LOYALTY_PERCENT}% от суммы проживания возвращается баллами`} />
      {loading ? <Loading /> : (
        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <div className="card p-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className="input pl-9" placeholder="Имя, email, телефон" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {shown.map((g) => (
              <button key={g.id} onClick={() => { setMsg(''); load(g.id); }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left ${sel?.id === g.id ? 'bg-navy-900 text-white' : 'hover:bg-slate-50'}`}>
                <span><span className="block font-medium">{g.name}</span><span className={`text-xs ${sel?.id === g.id ? 'text-white/60' : 'text-slate-500'}`}>{g.email || g.phone || '—'}</span></span>
                <span className="font-semibold text-gold-600">{g.points}</span>
              </button>
            ))}
            {!shown.length && <p className="text-sm text-slate-400 p-3">Гостей нет</p>}
          </div>
          <div className="card p-5">
            {!sel ? <p className="text-sm text-slate-400">Выберите гостя слева</p> : (
              <>
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-gold-600" />
                  <div className="flex-1"><p className="text-lg font-semibold text-navy-900">{sel.name}</p><p className="text-xs text-slate-500">{sel.email} {sel.phone && `· ${sel.phone}`}</p></div>
                  <div className="text-right"><p className="text-2xl font-bold text-navy-900">{sel.points}</p><p className="text-xs text-slate-500">баллов</p></div>
                </div>
                {canAdjustPoints(me?.role) && (
                  <div className="mt-5 grid sm:grid-cols-[120px_1fr_auto_auto] gap-2">
                    <input className="input" inputMode="numeric" placeholder="Баллы" value={delta} onChange={(e) => setDelta(e.target.value.replace(/\D/g, ''))} />
                    <input className="input" placeholder="Причина (обязательно)" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <button onClick={() => apply(1)} className="btn-gold"><Plus className="w-4 h-4" />Начислить</button>
                    <button onClick={() => apply(-1)} className="btn-ghost"><Minus className="w-4 h-4" />Списать</button>
                  </div>
                )}
                {msg && <p className="text-sm text-slate-600 mt-2">{msg}</p>}
                <h3 className="font-semibold text-navy-900 mt-6 mb-2">История</h3>
                <div className="divide-y divide-slate-100">
                  {tx.map((t) => (
                    <div key={t.id} className="py-2.5 flex justify-between text-sm">
                      <span>{reasonLabel(t.reason)}<span className="block text-xs text-slate-400">{fmt(t.created_at)}</span></span>
                      <span className={`font-semibold ${t.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</span>
                    </div>
                  ))}
                  {!tx.length && <p className="text-sm text-slate-400 py-2">Операций нет</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

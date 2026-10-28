'use client';

import { useEffect, useState } from 'react';
import { supabase, InventoryItem } from '@/lib/supabase';
import { AlertTriangle, Plus, Minus } from 'lucide-react';
import { PageHeader, Loading } from '@/components/AppShell';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('name');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const adjust = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
    load();
  };

  const lowStock = items.filter(i => i.quantity <= i.min_quantity);

  return (
    <div className="space-y-5">
      <PageHeader title="Инвентарь" subtitle="Учёт расходных материалов и оборудования" />

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-medium text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {lowStock.length} позиций с низким запасом</p>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Название</th>
                <th className="px-6 py-3">Категория</th>
                <th className="px-6 py-3">Локация</th>
                <th className="px-6 py-3 text-right">Количество</th>
                <th className="px-6 py-3 text-right">Мин.</th>
                <th className="px-6 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => {
                const isLow = item.quantity <= item.min_quantity;
                return (
                  <tr key={item.id} className={isLow ? 'bg-amber-50' : ''}>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-slate-600">{item.location || '—'}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${isLow ? 'text-amber-700' : ''}`}>{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.min_quantity}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => adjust(item.id, -1)} className="p-1 rounded hover:bg-slate-100"><Minus className="w-4 h-4" /></button>
                        <button onClick={() => adjust(item.id, 1)} className="p-1 rounded hover:bg-slate-100"><Plus className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// DEV-ONLY demo data source. Active only when NEXT_PUBLIC_DEMO_MODE=1 and NODE_ENV !== 'production'.
// All names below are fictional demo data, not real guests.
const d = (offset: number) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
};

function seed(): Record<string, any[]> {
  const rooms = [
    ['101', 'standard', 'occupied', 4500, 1], ['102', 'standard', 'available', 4500, 1], ['103', 'deluxe', 'cleaning', 6500, 1],
    ['104', 'standard', 'available', 4500, 1], ['105', 'family', 'occupied', 8000, 1], ['106', 'standard', 'maintenance', 4500, 1],
    ['201', 'deluxe', 'occupied', 6500, 2], ['202', 'deluxe', 'available', 6500, 2], ['203', 'standard', 'cleaning', 4500, 2],
    ['204', 'suite', 'occupied', 12000, 2], ['205', 'standard', 'available', 4500, 2], ['206', 'deluxe', 'available', 6500, 2],
    ['301', 'suite', 'available', 12000, 3], ['302', 'family', 'occupied', 8000, 3], ['303', 'deluxe', 'cleaning', 6500, 3],
  ].map(([number, type, status, price, floor], i) => ({
    id: `r${i}`, number, type, status, price_per_night: price, capacity: 2, floor, amenities: [], photo_url: null,
  }));
  const id = (n: string) => rooms.find((r) => r.number === n)!.id;
  const bookings = [
    ['b1', '101', 'Демо Гость 1', d(-2), d(0), 'checked_in'],
    ['b2', '201', 'Демо Гость 2', d(-1), d(2), 'checked_in'],
    ['b3', '102', 'Демо Гость 3', d(0), d(3), 'confirmed'],
    ['b4', '205', 'Демо Гость 4', d(0), d(1), 'confirmed'],
    ['b5', '204', 'Демо Гость 5', d(-3), d(0), 'checked_in'],
    ['b6', '105', 'Демо Гость 6', d(-1), d(4), 'checked_in'],
    ['b7', '302', 'Демо Гость 7', d(-4), d(1), 'checked_in'],
    ['b8', '301', 'Демо Гость 8', d(2), d(5), 'confirmed'],
    ['b9', '104', 'Демо Гость 9', d(-6), d(-3), 'checked_out'],
  ].map(([bid, room, guest_name, check_in, check_out, status]) => ({
    id: bid, room_id: id(room), guest_name, guest_phone: '+996 700 000 000', guest_email: 'demo@example.com',
    check_in, check_out, status, notes: bid === 'b3' ? 'Демо: поздний заезд' : null, created_at: d(-7),
  }));
  const employees = [
    ['e1', 'Демо Администратор', 'admin', 520, 6], ['e2', 'Демо Горничная', 'housekeeping', 310, 4],
    ['e3', 'Демо Ресепшен', 'receptionist', 150, 2], ['e4', 'Демо Техник', 'maintenance', 80, 1],
  ].map(([eid, name, role, points, level]) => ({ id: eid, auth_user_id: null, name, email: `${eid}@example.com`, role, points, level, avatar_url: null, phone: null }));
  const inventory = [
    ['Полотенца', 'текстиль', 120, 20], ['Шампунь', 'гигиена', 12, 30], ['Кофе', 'мини-бар', 45, 10],
  ].map(([name, category, quantity, min_quantity], i) => ({ id: `i${i}`, name, category, quantity, min_quantity, location: 'склад', unit: 'шт' }));
  const tasks = [
    { id: 't1', title: 'Уборка номера 103', description: null, employee_id: 'e2', room_id: id('103'), points: 10, status: 'in_progress', type: 'cleaning', is_daily: false, completed_at: null },
    { id: 't2', title: 'Починить кран в 106', description: 'Демо-задача', employee_id: null, room_id: id('106'), points: 20, status: 'pending', type: 'maintenance', is_daily: false, completed_at: null },
    { id: 't3', title: 'Проверить мини-бар', description: null, employee_id: 'e3', room_id: null, points: 5, status: 'completed', type: 'inventory', is_daily: true, completed_at: d(0) },
  ];
  return { rooms, bookings, employees, inventory, tasks, achievements: [], employee_achievements: [] };
}

export function createDemoClient() {
  const db = seed();
  const from = (table: string) => {
    let filters: [string, any][] = [];
    let orderBy: [string, boolean] | null = null;
    let lim: number | null = null;
    let single = false;
    let op: 'select' | 'update' | 'insert' | 'delete' = 'select';
    let payload: any = null;
    const run = () => {
      const rows = (db[table] ||= []);
      const match = (r: any) => filters.every(([k, v]) => r[k] === v);
      if (op === 'insert') {
        const arr = Array.isArray(payload) ? payload : [payload];
        arr.forEach((p: any) => rows.push({ id: `n${Date.now()}${Math.random()}`, created_at: new Date().toISOString(), ...p }));
        return { data: arr, error: null };
      }
      if (op === 'update') { rows.filter(match).forEach((r) => Object.assign(r, payload)); return { data: null, error: null }; }
      if (op === 'delete') { db[table] = rows.filter((r) => !match(r)); return { data: null, error: null }; }
      let out = rows.filter(match).map((r) => ({ ...r }));
      if (orderBy) { const [k, asc] = orderBy; out.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (asc ? 1 : -1)); }
      if (lim != null) out = out.slice(0, lim);
      return { data: single ? out[0] ?? null : out, error: null };
    };
    const q: any = {
      select: () => q,
      insert: (p: any) => { op = 'insert'; payload = p; return q; },
      update: (p: any) => { op = 'update'; payload = p; return q; },
      delete: () => { op = 'delete'; return q; },
      eq: (k: string, v: any) => { filters.push([k, v]); return q; },
      order: (k: string, o?: { ascending?: boolean }) => { orderBy = [k, o?.ascending !== false]; return q; },
      limit: (n: number) => { lim = n; return q; },
      single: () => { single = true; return q; },
      maybeSingle: () => { single = true; return q; },
      then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
    };
    return q;
  };
  const user = { id: 'demo', email: 'demo@example.com' };
  return {
    from,
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session: { user } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user }, error: null }),
      signUp: async () => ({ data: { user }, error: null }),
    },
  };
}

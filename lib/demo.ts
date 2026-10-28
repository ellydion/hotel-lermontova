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
    guest_id: bid === 'b2' || bid === 'b8' || bid === 'b9' ? 'g1' : null,
  }));
  const employees = [
    ['e1', 'Демо Администратор', 'admin', 520, 6], ['e2', 'Демо Горничная', 'housekeeping', 310, 4],
    ['e3', 'Демо Ресепшен', 'receptionist', 150, 2], ['e4', 'Демо Техник', 'maintenance', 80, 1],
    ['e5', 'Демо Менеджер', 'manager', 400, 5],
  ].map(([eid, name, role, points, level]) => ({ id: eid, auth_user_id: `u-${eid}`, name, email: `${eid}@example.com`, role, points, level, avatar_url: null, phone: null }));
  const inventory = [
    ['Полотенца', 'текстиль', 120, 20], ['Шампунь', 'гигиена', 12, 30], ['Кофе', 'мини-бар', 45, 10],
  ].map(([name, category, quantity, min_quantity], i) => ({ id: `i${i}`, name, category, quantity, min_quantity, location: 'склад', unit: 'шт' }));
  const tasks: any[] = [
    { id: 't1', title: 'Уборка номера 103', description: null, employee_id: 'e2', room_id: id('103'), points: 10, status: 'in_progress', type: 'cleaning', is_daily: false, completed_at: null },
    { id: 't2', title: 'Починить кран в 106', description: 'Демо-задача', employee_id: null, room_id: id('106'), points: 20, status: 'pending', type: 'maintenance', is_daily: false, completed_at: null },
    { id: 't3', title: 'Проверить мини-бар', description: null, employee_id: 'e3', room_id: null, points: 5, status: 'completed', type: 'inventory', is_daily: true, completed_at: d(0) },
  ];
  tasks.push(
    { id: 't4', title: 'Уборка номера 203 после выезда', description: 'Смена белья, полотенца', employee_id: 'e2', room_id: id('203'), points: 10, status: 'pending', type: 'cleaning', is_daily: false, completed_at: null },
    { id: 't5', title: 'Уборка номера 303', description: null, employee_id: null, room_id: id('303'), points: 10, status: 'pending', type: 'cleaning', is_daily: false, completed_at: null },
    { id: 't6', title: 'Ежедневный обход 1 этажа', description: null, employee_id: 'e2', room_id: null, points: 5, status: 'completed', type: 'daily', is_daily: true, completed_at: d(0) },
  );
  const guests = [
    { id: 'g1', auth_user_id: 'u-g1', name: 'Демо Гость 2', email: 'guest@example.com', phone: '+996 700 000 000', points: 1625, created_at: d(-30) },
    { id: 'g2', auth_user_id: null, name: 'Демо Гость 5', email: 'guest5@example.com', phone: null, points: 300, created_at: d(-20) },
  ];
  const loyalty_transactions = [
    { id: 'l1', guest_id: 'g1', booking_id: 'b9', points: 675, reason: 'stay', created_by: null, created_at: d(-3) },
    { id: 'l2', guest_id: 'g1', booking_id: null, points: 1000, reason: 'Приветственный бонус', created_by: 'e1', created_at: d(-30) },
    { id: 'l3', guest_id: 'g1', booking_id: null, points: -50, reason: 'Списание: поздний выезд', created_by: 'e3', created_at: d(-2) },
    { id: 'l4', guest_id: 'g2', booking_id: null, points: 300, reason: 'Приветственный бонус', created_by: 'e1', created_at: d(-20) },
  ];
  return { rooms, bookings, employees, inventory, tasks, guests, loyalty_transactions, achievements: [], employee_achievements: [] };
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
        arr.forEach((p: any) => {
          rows.push({ id: `n${Date.now()}${Math.random()}`, created_at: new Date().toISOString(), ...p });
          // имитация триггера БД: баланс гостя = сумма операций
          if (table === 'loyalty_transactions') {
            const g = db.guests.find((x) => x.id === p.guest_id);
            if (g) g.points = Math.max(0, g.points + p.points);
          }
        });
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
  // Демо-пользователь: ?as=admin|manager|receptionist|housekeeping|maintenance|guest (запоминается в localStorage)
  const demoAs = () => {
    if (typeof window === 'undefined') return 'admin';
    const q = new URLSearchParams(window.location.search).get('as');
    if (q) window.localStorage.setItem('demo_as', q);
    return window.localStorage.getItem('demo_as') || 'admin';
  };
  const roleToUid: Record<string, string> = { admin: 'u-e1', housekeeping: 'u-e2', receptionist: 'u-e3', maintenance: 'u-e4', manager: 'u-e5', guest: 'u-g1' };
  const currentUser = () => { const uid = roleToUid[demoAs()] || 'u-e1'; return { id: uid, email: `${uid}@example.com` }; };
  return {
    from,
    auth: {
      getUser: async () => ({ data: { user: currentUser() }, error: null }),
      getSession: async () => ({ data: { session: { user: currentUser() } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: currentUser() }, error: null }),
      signUp: async () => ({ data: { user: currentUser(), session: { user: currentUser() } }, error: null }),
    },
  };
}

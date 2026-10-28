export type StaffRole = 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'maintenance';

export const ROLES: StaffRole[] = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];

export const roleLabels: Record<StaffRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  receptionist: 'Ресепшен',
  housekeeping: 'Горничная (уборка)',
  maintenance: 'Техник',
};

// Какие разделы видит каждая роль. Первый раздел — стартовый после входа.
export const roleSections: Record<StaffRole, string[]> = {
  admin: ['/', '/rooms', '/bookings', '/guests', '/tasks', '/employees', '/inventory'],
  manager: ['/', '/rooms', '/bookings', '/guests', '/tasks', '/employees', '/inventory'],
  receptionist: ['/', '/rooms', '/bookings', '/guests', '/tasks'],
  housekeeping: ['/tasks', '/rooms', '/inventory'],
  maintenance: ['/tasks', '/rooms'],
};

// Какие типы заданий видит роль на странице «Задания» (null = все).
export const roleTaskTypes: Record<StaffRole, string[] | null> = {
  admin: null, manager: null, receptionist: null,
  housekeeping: ['cleaning', 'daily', 'inventory'],
  maintenance: ['maintenance'],
};

const sectionOf = (path: string) => {
  if (path === '/') return '/';
  return '/' + path.split('/')[1];
};

export const canAccess = (role: StaffRole, path: string) => roleSections[role].includes(sectionOf(path));
export const homeFor = (role: StaffRole) => roleSections[role][0];
// Управление ролями — только админ.
export const canManageRoles = (role: StaffRole | null | undefined) => role === 'admin';
// Корректировка баллов гостей.
export const canAdjustPoints = (role: StaffRole | null | undefined) => role === 'admin' || role === 'manager' || role === 'receptionist';

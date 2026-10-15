-- Обновлённая схема для Отеля Лермонтова (v2)
-- Выполните в Supabase SQL Editor (можно поверх предыдущей, или создайте новый проект)

create extension if not exists "uuid-ossp";

-- Номера (+ фото)
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  number text not null unique,
  type text not null check (type in ('standard', 'deluxe', 'suite', 'family')),
  status text not null default 'available' check (status in ('available', 'occupied', 'cleaning', 'maintenance')),
  price_per_night numeric not null,
  capacity integer not null default 2,
  floor integer,
  amenities jsonb default '[]'::jsonb,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Сотрудники (+ связь с auth)
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text unique,
  role text not null check (role in ('admin', 'receptionist', 'housekeeping', 'maintenance', 'manager')),
  points integer default 0,
  level integer default 1,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

-- Инвентарь
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  quantity integer not null default 0,
  min_quantity integer default 5,
  location text,
  unit text default 'шт',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Задания
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  employee_id uuid references employees(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  points integer not null default 10,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  type text not null check (type in ('cleaning', 'checkin', 'checkout', 'maintenance', 'inventory', 'other', 'daily')),
  is_daily boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Бронирования
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id),
  guest_name text not null,
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  status text default 'confirmed' check (status in ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  notes text,
  created_by uuid references employees(id),
  created_at timestamptz default now()
);

-- Ачивки
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  description text,
  points_required integer default 0,
  icon text default '🏆',
  created_at timestamptz default now()
);

create table if not exists employee_achievements (
  employee_id uuid references employees(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  primary key (employee_id, achievement_id)
);

-- Триггеры updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_rooms_updated_at on rooms;
create trigger update_rooms_updated_at before update on rooms
  for each row execute function update_updated_at_column();

drop trigger if exists update_inventory_updated_at on inventory;
create trigger update_inventory_updated_at before update on inventory
  for each row execute function update_updated_at_column();

-- Демо-данные
insert into rooms (number, type, status, price_per_night, capacity, floor) values
  ('101', 'standard', 'available', 4500, 2, 1),
  ('102', 'standard', 'occupied', 4500, 2, 1),
  ('201', 'deluxe', 'cleaning', 6500, 2, 2),
  ('202', 'deluxe', 'available', 6500, 2, 2),
  ('301', 'suite', 'available', 12000, 4, 3),
  ('302', 'family', 'maintenance', 8000, 4, 3)
on conflict (number) do nothing;

insert into employees (name, email, role, points, level) values
  ('Анна Иванова', 'anna@lermontova.ru', 'receptionist', 150, 2),
  ('Петр Смирнов', 'petr@lermontova.ru', 'housekeeping', 320, 3),
  ('Мария Козлова', 'maria@lermontova.ru', 'housekeeping', 280, 3),
  ('Иван Петров', 'ivan@lermontova.ru', 'maintenance', 90, 1),
  ('Елена Соколова', 'elena@lermontova.ru', 'manager', 500, 5)
on conflict (email) do nothing;

insert into inventory (name, category, quantity, min_quantity, location) values
  ('Полотенца банные', 'текстиль', 120, 20, 'warehouse'),
  ('Постельное белье', 'текстиль', 80, 15, 'warehouse'),
  ('Шампунь', 'гигиена', 200, 30, 'warehouse'),
  ('Мыло', 'гигиена', 250, 40, 'warehouse'),
  ('Кофе', 'мини-бар', 45, 10, 'warehouse'),
  ('Чай', 'мини-бар', 60, 10, 'warehouse')
on conflict do nothing;

insert into achievements (code, name, description, points_required, icon) values
  ('first_task', 'Первое задание', 'Выполнили первое задание', 0, '🎯'),
  ('points_100', 'Сотня', 'Набрали 100 баллов', 100, '💯'),
  ('points_500', 'Полтысячи', 'Набрали 500 баллов', 500, '🔥'),
  ('cleaner', 'Чистюля', 'Выполнили 10 уборок', 0, '🧹'),
  ('legend', 'Легенда', 'Достигли 5 уровня', 0, '👑')
on conflict (code) do nothing;

-- Storage bucket для фото (выполнить отдельно в Storage UI или SQL):
-- insert into storage.buckets (id, name, public) values ('room-photos', 'room-photos', true);

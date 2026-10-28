-- =====================================================================
-- Отель Лермонтова: роли персонала, кабинет гостя, бонусные баллы, RLS по ролям
-- Миграция подготовлена 28.10.2026. НЕ ПРИМЕНЕНА.
-- Применять ПОСЛЕ sql/rls.sql (берёт оттуда is_staff/is_manager/current_employee_id).
--
-- Роли сотрудников (employees.role, уже есть в схеме):
--   admin — всё + управление ролями; manager — всё, кроме смены ролей;
--   receptionist — сегодня, номера, брони, гости, задания;
--   housekeeping — задания по уборке, статусы номеров, инвентарь (без броней/гостей);
--   maintenance  — задания по ремонту, статусы номеров.
-- Гости: таблица guests (привязка к auth.users), брони bookings.guest_id,
--   операции баллов loyalty_transactions; баланс guests.points считает триггер.
--   Процент начисления задаётся в коде (lib/loyalty.ts, LOYALTY_PERCENT).
-- =====================================================================

begin;

-- ---------- Таблицы ----------
create table if not exists public.guests (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text unique,
  phone text,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz default now()
);

alter table public.bookings add column if not exists guest_id uuid references public.guests(id) on delete set null;
create index if not exists bookings_guest_id_idx on public.bookings(guest_id);

create table if not exists public.loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  points integer not null check (points <> 0),
  reason text not null,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists loyalty_tx_guest_idx on public.loyalty_transactions(guest_id, created_at desc);
-- за одну бронь начисление «за проживание» только один раз
create unique index if not exists loyalty_tx_stay_once on public.loyalty_transactions(booking_id) where reason = 'stay';

-- ---------- Функции ролей ----------
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.employees where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.has_role(roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = any(roles), false)
$$;

create or replace function public.current_guest_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.guests where auth_user_id = auth.uid() limit 1
$$;

revoke all on function public.current_role_name(), public.has_role(text[]), public.current_guest_id() from public, anon;
grant execute on function public.current_role_name(), public.has_role(text[]), public.current_guest_id() to authenticated, service_role;

-- ---------- Баланс баллов = сумма операций (клиент баланс не пишет) ----------
create or replace function public.apply_loyalty_tx()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.guests set points = points + new.points where id = new.guest_id;
  return new;
end $$;
drop trigger if exists loyalty_tx_apply on public.loyalty_transactions;
create trigger loyalty_tx_apply after insert on public.loyalty_transactions
  for each row execute function public.apply_loyalty_tx();
-- check (points >= 0) на guests не даст списать больше баланса.

-- ---------- Привязка новых пользователей Auth ----------
-- email совпал с employees.email → привязываем сотрудника;
-- иначе регистрация из кабинета гостя (metadata account=guest) → создаём гостя.
create or replace function public.link_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.employees set auth_user_id = new.id
   where lower(email) = lower(new.email) and auth_user_id is null;
  if not found and coalesce(new.raw_user_meta_data->>'account', '') = 'guest' then
    insert into public.guests (auth_user_id, name, email, phone)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name', ''), new.email), lower(new.email),
            nullif(new.raw_user_meta_data->>'phone', ''))
    on conflict (email) do update set auth_user_id = excluded.auth_user_id
      where public.guests.auth_user_id is null;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_link on auth.users;
create trigger on_auth_user_created_link after insert on auth.users
  for each row execute function public.link_new_auth_user();

-- ---------- Роль меняет только admin ----------
create or replace function public.guard_employee_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.has_role(array['admin']) and auth.role() <> 'service_role' then
    raise exception 'Менять роль может только администратор';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id and not public.has_role(array['admin']) and auth.role() <> 'service_role' then
    raise exception 'Привязку входа меняет только администратор';
  end if;
  return new;
end $$;
drop trigger if exists employees_guard_role on public.employees;
create trigger employees_guard_role before update on public.employees
  for each row execute function public.guard_employee_role();

-- ---------- Баллы сотрудникам за задания — в базе (из браузера убрано) ----------
create or replace function public.award_task_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.employee_id is not null then
    update public.employees
       set points = points + new.points,
           level  = greatest(level, ((points + new.points) / 100) + 1)
     where id = new.employee_id;
  end if;
  return new;
end $$;
drop trigger if exists tasks_award_points on public.tasks;
create trigger tasks_award_points after update on public.tasks
  for each row execute function public.award_task_points();

-- ---------- GRANT ----------
revoke all on table public.guests, public.loyalty_transactions from anon;
grant select, insert, update, delete on table public.guests, public.loyalty_transactions to authenticated;
grant all on table public.guests, public.loyalty_transactions to service_role;

alter table public.guests enable row level security;
alter table public.loyalty_transactions enable row level security;

-- ---------- RLS по ролям (заменяет часть политик из rls.sql) ----------
-- bookings: персонал фронт-офиса; гость — только свои
drop policy if exists bookings_select on public.bookings;
drop policy if exists bookings_insert on public.bookings;
drop policy if exists bookings_update on public.bookings;
create policy bookings_select on public.bookings for select to authenticated
  using (public.has_role(array['admin','manager','receptionist']) or guest_id = public.current_guest_id());
create policy bookings_insert on public.bookings for insert to authenticated
  with check (public.has_role(array['admin','manager','receptionist']));
create policy bookings_update on public.bookings for update to authenticated
  using (public.has_role(array['admin','manager','receptionist']))
  with check (public.has_role(array['admin','manager','receptionist']));

-- rooms: персонал читает и меняет статус; гость читает (для своих броней)
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms for select to authenticated
  using (public.is_staff() or public.current_guest_id() is not null);

-- employees: изменения — admin/manager или сам себя (смена роли — триггер выше)
drop policy if exists employees_insert on public.employees;
drop policy if exists employees_delete on public.employees;
create policy employees_insert on public.employees for insert to authenticated with check (public.has_role(array['admin']));
create policy employees_delete on public.employees for delete to authenticated using (public.has_role(array['admin']));

-- tasks: горничная видит уборку/ежедневные/инвентарь, техник — ремонт; остальные — всё
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_update on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (
  public.has_role(array['admin','manager','receptionist'])
  or (public.has_role(array['housekeeping']) and type in ('cleaning','daily','inventory'))
  or (public.has_role(array['maintenance']) and type = 'maintenance'));
create policy tasks_update on public.tasks for update to authenticated using (
  public.has_role(array['admin','manager','receptionist'])
  or (public.has_role(array['housekeeping']) and type in ('cleaning','daily','inventory')
      and (employee_id is null or employee_id = public.current_employee_id()))
  or (public.has_role(array['maintenance']) and type = 'maintenance'
      and (employee_id is null or employee_id = public.current_employee_id())))
  with check (public.is_staff());

-- inventory: читают и меняют admin/manager/housekeeping
drop policy if exists inventory_select on public.inventory;
drop policy if exists inventory_update on public.inventory;
create policy inventory_select on public.inventory for select to authenticated using (public.has_role(array['admin','manager','housekeeping']));
create policy inventory_update on public.inventory for update to authenticated
  using (public.has_role(array['admin','manager','housekeeping'])) with check (public.has_role(array['admin','manager','housekeeping']));

-- guests: фронт-офис видит всех и правит профиль; гость — только себя (баланс меняет только триггер)
drop policy if exists guests_select on public.guests;
drop policy if exists guests_staff_write on public.guests;
create policy guests_select on public.guests for select to authenticated
  using (public.has_role(array['admin','manager','receptionist']) or auth_user_id = auth.uid());
create policy guests_staff_write on public.guests for all to authenticated
  using (public.has_role(array['admin','manager','receptionist']))
  with check (public.has_role(array['admin','manager','receptionist']));
revoke update (points) on public.guests from authenticated;

-- loyalty_transactions: читает фронт-офис и сам гость; пишет только фронт-офис; не правится и не удаляется
drop policy if exists loyalty_select on public.loyalty_transactions;
drop policy if exists loyalty_insert on public.loyalty_transactions;
create policy loyalty_select on public.loyalty_transactions for select to authenticated
  using (public.has_role(array['admin','manager','receptionist']) or guest_id = public.current_guest_id());
create policy loyalty_insert on public.loyalty_transactions for insert to authenticated
  with check (public.has_role(array['admin','manager','receptionist']));

commit;

-- =====================================================================
-- ПОСЛЕ применения:
--   1) назначить хотя бы одного admin (service_role / SQL Editor):
--      update public.employees set role = 'admin' where email = '<email владельца>';
--   2) привязать уже существующих пользователей Auth:
--      update public.employees e set auth_user_id = u.id from auth.users u
--        where lower(u.email) = lower(e.email) and e.auth_user_id is null;
--   3) Auth → оставить регистрацию включённой (её используют гости); сотрудник получит доступ
--      только если его email заранее добавлен админом в «Сотрудники».
-- ОТКАТ: drop trigger on_auth_user_created_link on auth.users; drop trigger employees_guard_role on public.employees;
--   drop trigger tasks_award_points on public.tasks; drop table public.loyalty_transactions; 
--   alter table public.bookings drop column guest_id; drop table public.guests; (+ вернуть политики из rls.sql)
-- =====================================================================

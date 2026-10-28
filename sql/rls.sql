-- =====================================================================
-- Отель Лермонтова: включение RLS + явные GRANT (миграция, НЕ применена)
-- Подготовлено 26.10.2026. Применять в Supabase SQL Editor / через миграцию.
--
-- Как приложение ходит в базу (по коду):
--   * только браузерный клиент с anon key (lib/supabase.ts), без сервера и service_role;
--   * есть вход/регистрация через Supabase Auth (app/login), НО страницы не требуют
--     входа — данные сейчас читаются/меняются ролью anon кем угодно из интернета.
--   * клиент сам обновляет employees.points/level при выполнении задания (app/tasks).
--
-- Что меняет миграция:
--   * anon больше НЕ видит и НЕ меняет ни одной таблицы (без входа страницы будут пустыми);
--   * доступ только у вошедших пользователей, привязанных к записи сотрудника
--     (employees.auth_user_id = auth.uid()); справочники/сотрудников правят admin/manager;
--   * service_role (бэкенд/скрипты) — полный доступ (он и так обходит RLS);
--   * явные GRANT — нужны из-за изменения Supabase с 30.10.2026.
--
-- ДО применения обязательно:
--   1) Supabase → Authentication → отключить публичную регистрацию (Allow new users to sign up = off),
--      иначе любой может зарегистрироваться; (с этой миграцией он всё равно не получит
--      доступа, пока не привязан к employees, но лучше закрыть).
--   2) Привязать реальных сотрудников к auth-пользователям (см. блок BOOTSTRAP внизу),
--      иначе после включения RLS никто, кроме service_role, данных не увидит.
--   3) Желательно в коде добавить редирект на /login для невошедших (сейчас его нет).
-- =====================================================================

begin;

-- ---------- Вспомогательные функции (SECURITY DEFINER, чтобы не было рекурсии RLS) ----------
create or replace function public.current_employee_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.employees where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.employees where auth_user_id = auth.uid())
$$;

create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.employees
    where auth_user_id = auth.uid() and role in ('admin', 'manager')
  )
$$;

revoke all on function public.current_employee_id(), public.is_staff(), public.is_manager() from public, anon;
grant execute on function public.current_employee_id(), public.is_staff(), public.is_manager() to authenticated, service_role;

-- ---------- GRANT: явные права (anon — ничего) ----------
grant usage on schema public to authenticated, service_role;

revoke all on table
  public.rooms, public.bookings, public.employees, public.tasks,
  public.inventory, public.achievements, public.employee_achievements
from anon;

grant select, insert, update, delete on table
  public.rooms, public.bookings, public.employees, public.tasks,
  public.inventory, public.achievements, public.employee_achievements
to authenticated;

grant all on table
  public.rooms, public.bookings, public.employees, public.tasks,
  public.inventory, public.achievements, public.employee_achievements
to service_role;

-- ---------- Включаем RLS ----------
alter table public.rooms                 enable row level security;
alter table public.bookings              enable row level security;
alter table public.employees             enable row level security;
alter table public.tasks                 enable row level security;
alter table public.inventory             enable row level security;
alter table public.achievements          enable row level security;
alter table public.employee_achievements enable row level security;

-- ---------- rooms: сотрудники читают и меняют статус; создают/удаляют — admin/manager ----------
drop policy if exists rooms_select on public.rooms;
drop policy if exists rooms_update on public.rooms;
drop policy if exists rooms_insert on public.rooms;
drop policy if exists rooms_delete on public.rooms;
create policy rooms_select on public.rooms for select to authenticated using (public.is_staff());
create policy rooms_update on public.rooms for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy rooms_insert on public.rooms for insert to authenticated with check (public.is_manager());
create policy rooms_delete on public.rooms for delete to authenticated using (public.is_manager());

-- ---------- bookings: сотрудники читают/создают/меняют статус; удаляют — admin/manager ----------
drop policy if exists bookings_select on public.bookings;
drop policy if exists bookings_insert on public.bookings;
drop policy if exists bookings_update on public.bookings;
drop policy if exists bookings_delete on public.bookings;
create policy bookings_select on public.bookings for select to authenticated using (public.is_staff());
create policy bookings_insert on public.bookings for insert to authenticated with check (public.is_staff());
create policy bookings_update on public.bookings for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy bookings_delete on public.bookings for delete to authenticated using (public.is_manager());

-- ---------- employees: сотрудники видят коллег; правят — admin/manager или сам себя ----------
-- ВНИМАНИЕ: app/tasks сейчас из браузера начисляет баллы другому сотруднику (employees.update).
-- С этой политикой это сработает только у admin/manager или у исполнителя для своей записи.
-- Правильнее перенести начисление в функцию/триггер на tasks (см. ниже, закомментировано).
drop policy if exists employees_select on public.employees;
drop policy if exists employees_update on public.employees;
drop policy if exists employees_insert on public.employees;
drop policy if exists employees_delete on public.employees;
create policy employees_select on public.employees for select to authenticated using (public.is_staff());
create policy employees_update on public.employees for update to authenticated
  using (public.is_manager() or auth_user_id = auth.uid())
  with check (public.is_manager() or auth_user_id = auth.uid());
create policy employees_insert on public.employees for insert to authenticated with check (public.is_manager());
create policy employees_delete on public.employees for delete to authenticated using (public.is_manager());

-- ---------- tasks: сотрудники читают, берут и закрывают; создают/удаляют — admin/manager ----------
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_delete on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (public.is_staff());
create policy tasks_update on public.tasks for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_manager());
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_manager());

-- ---------- inventory: сотрудники читают и меняют количество; создают/удаляют — admin/manager ----------
drop policy if exists inventory_select on public.inventory;
drop policy if exists inventory_update on public.inventory;
drop policy if exists inventory_insert on public.inventory;
drop policy if exists inventory_delete on public.inventory;
create policy inventory_select on public.inventory for select to authenticated using (public.is_staff());
create policy inventory_update on public.inventory for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy inventory_insert on public.inventory for insert to authenticated with check (public.is_manager());
create policy inventory_delete on public.inventory for delete to authenticated using (public.is_manager());

-- ---------- achievements: справочник — читают все сотрудники, правят admin/manager ----------
drop policy if exists achievements_select on public.achievements;
drop policy if exists achievements_write on public.achievements;
create policy achievements_select on public.achievements for select to authenticated using (public.is_staff());
create policy achievements_write on public.achievements for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- ---------- employee_achievements: читают сотрудники, выдают/отзывают admin/manager ----------
drop policy if exists employee_achievements_select on public.employee_achievements;
drop policy if exists employee_achievements_write on public.employee_achievements;
create policy employee_achievements_select on public.employee_achievements for select to authenticated using (public.is_staff());
create policy employee_achievements_write on public.employee_achievements for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- ---------- Права по умолчанию для будущих таблиц (требование Supabase с 30.10) ----------
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;

commit;

-- =====================================================================
-- (Опционально, рекомендуется) Начисление баллов на стороне БД вместо браузера:
-- create or replace function public.award_task_points() returns trigger
-- language plpgsql security definer set search_path = public as $$
-- begin
--   if new.status = 'completed' and old.status is distinct from 'completed' and new.employee_id is not null then
--     update public.employees
--        set points = points + new.points,
--            level  = greatest(level, ((points + new.points) / 100) + 1)
--      where id = new.employee_id;
--   end if;
--   return new;
-- end $$;
-- create trigger tasks_award_points after update on public.tasks
--   for each row execute function public.award_task_points();
-- (и убрать supabase.from('employees').update(...) из app/tasks/page.tsx)
-- =====================================================================

-- =====================================================================
-- BOOTSTRAP (выполнить вручную ПОСЛЕ создания пользователей в Auth, подставив email):
-- update public.employees e set auth_user_id = u.id
--   from auth.users u where lower(u.email) = lower(e.email) and e.auth_user_id is null;
-- -- и назначить хотя бы одного администратора:
-- -- update public.employees set role = 'admin' where email = '<email владельца>';
-- =====================================================================

-- =====================================================================
-- ОТКАТ (если что-то сломалось):
-- alter table public.<таблица> disable row level security;   -- для каждой из 7 таблиц
-- grant select, insert, update, delete on table public.<таблица> to anon;  -- вернуть старое поведение (небезопасно)
-- =====================================================================

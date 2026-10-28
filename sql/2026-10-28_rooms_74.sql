-- Удаление 6 тестовых номеров и создание 74 реальных (цены временные, сом)
begin;
delete from public.rooms where number in ('101','102','201','202','301','302')
  and not exists (select 1 from public.bookings b where b.room_id = rooms.id)
  and not exists (select 1 from public.tasks t where t.room_id = rooms.id);
insert into public.rooms (number, type, status, price_per_night, capacity, floor)
select (f*100+n)::text, case when n<=23 then 'standard' when n<=26 then 'lux' else 'family_lux' end, 'available',
       case when n<=23 then 4000 when n<=26 then 6000 else 8000 end,
       case when n<=23 then 2 when n<=26 then 3 else 4 end, f
from generate_series(3,4) f, generate_series(1,28) n
union all
select (500+n)::text, 'penta_lux', 'available', 8500, 2, 5 from generate_series(1,18) n;
do $$ begin if (select count(*) from public.rooms) <> 74 then raise exception 'ожидалось 74 номера'; end if; end $$;
commit;

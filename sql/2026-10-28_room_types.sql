-- Новые типы номеров (старые оставлены для совместимости, не используются)
alter table public.rooms drop constraint if exists rooms_type_check;
alter table public.rooms add constraint rooms_type_check check (type = any (array[
  'standard','deluxe','suite','family','lux','family_lux','penta_lux']));

# Отель Лермонтова - Система управления (v2)

Полнофункциональное веб-приложение: номера (+фото), бронирования, сотрудники, инвентарь, геймификация (задания, баллы, ачивки) и авторизация через Supabase Auth.

## Новое в v2
- Авторизация (вход / регистрация)
- Бронирования с заселением/выселением
- Загрузка фото номеров (Supabase Storage)
- Ачивки и поддержка ежедневных заданий

## Настройка

### 1. Supabase
1. Создайте проект на supabase.com
2. Выполните `sql/schema.sql` в SQL Editor
3. В Storage создайте bucket `room-photos` (public)
4. В Authentication включите Email provider
5. Скопируйте URL и anon key в `.env.local` или Vercel Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

### 2. Локально
```bash
npm install
npm run dev
```

### 3. Vercel
Подключите репозиторий, добавьте env vars, Deploy.

После входа можно управлять всем функционалом.

-- NinAI – Phase 6: Benachrichtigungen.
-- notification_log verhindert doppelte Pushes (z. B. Erinnerung nur einmal pro Tag,
-- Gutschein-Hinweis nur einmal pro Gutschein). Nur serverseitig (Jobs) beschreibbar.

create table public.notification_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

alter table public.notification_log enable row level security;
grant all on public.notification_log to service_role;

-- Erinnerung: stündlich (15 nach). Die Route schickt nur zwischen 19 und 22 Uhr
-- deutscher Zeit und höchstens einmal pro Tag.
select cron.schedule('ninaai-reminder', '15 * * * *', $$select public.call_job('/api/jobs/reminder')$$);

-- NinAI – Remind me, Phase R4: Tagesüberblick um 07:30 (standardmäßig aus).

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  daily_overview boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- Eigene Einstellungen lesen und ändern; der Admin hat hier keinen Zugriff.
create policy "user_settings: own" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_settings to authenticated;
grant all on public.user_settings to service_role;

-- Stündlich zur halben Stunde; die Route schickt nur um 07:30 (bzw. holt bis 08:30
-- nach) und höchstens einmal pro Tag – unabhängig von Sommer-/Winterzeit.
select cron.schedule('ninaai-daily-overview', '30 * * * *', $$select public.call_job('/api/jobs/daily-overview')$$);

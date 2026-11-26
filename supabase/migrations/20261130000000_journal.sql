-- NinAI – Modul „Journal“, Phase J1. Siehe SPEC-journal.md › Datenmodell und › Privatsphäre.
-- Streng privat: nur die Besitzerin liest und schreibt. Die Admin-Rolle bekommt
-- ausdrücklich keinen Zugriff – auch nicht auf Bewertungen oder Durchschnittswerte.
-- (Keine Tabelle mood_checkins: Check-ins sind laut Entscheidung nicht gewünscht.)

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  rating smallint not null check (rating between 1 and 10),
  mood_word text check (mood_word in ('happy', 'calm', 'grateful', 'tired', 'stressed', 'sad', 'excited')),
  day_text text not null check (length(trim(day_text)) between 1 and 5000),
  gratitude text[] not null check (coalesce(array_length(gratitude, 1), 0) between 1 and 3),
  highlight text not null default '' check (length(highlight) <= 1000),
  tomorrow_focus text not null default '' check (length(tomorrow_focus) <= 1000),
  feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index journal_entries_user_date_idx on public.journal_entries (user_id, date desc);

create table public.journal_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month date not null check (extract(day from month) = 1), -- Monatserster
  summary_en text not null,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.journal_entries enable row level security;
alter table public.journal_reviews enable row level security;

create policy "journal_entries: own" on public.journal_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "journal_reviews: read own" on public.journal_reviews
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.journal_entries to authenticated;
grant select on public.journal_reviews to authenticated;
grant all on public.journal_entries to service_role;
grant all on public.journal_reviews to service_role;

-- NinAI – initiales Schema
-- Tabellen, Row Level Security und Hilfsfunktionen. Siehe SPEC.md › Datenmodell.

-- ---------------------------------------------------------------------------
-- Profile & Rollen
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'player' check (role in ('player', 'admin')),
  english_level text not null default 'B1',
  created_at timestamptz not null default now()
);

-- Prüft, ob der aktuell angemeldete Nutzer Admin ist. SECURITY DEFINER, damit die
-- Abfrage nicht selbst an der RLS von profiles hängen bleibt.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Rolle aus den App-Metadaten (nur serverseitig setzbar, z. B. per
-- scripts/create-user.mjs). Alles außer 'admin' gilt als 'player'.
create function public.role_from_app_metadata(meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when meta ->> 'role' = 'admin' then 'admin' else 'player' end;
$$;

-- Legt bei jedem neuen Auth-Konto ein Profil an.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    public.role_from_app_metadata(new.raw_app_meta_data)
  );
  perform public.ensure_player_streak(new.id);
  return new;
end;
$$;

-- Supabase Auth schreibt app_metadata erst nach dem INSERT (per UPDATE).
-- Dieser Trigger überträgt jede Rollenänderung ins Profil.
create function public.handle_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set role = public.role_from_app_metadata(new.raw_app_meta_data)
   where id = new.id;
  perform public.ensure_player_streak(new.id);
  return new;
end;
$$;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- Tageslektion & Fortschritt
-- ---------------------------------------------------------------------------

create table public.daily_lessons (
  date date primary key,
  status text not null default 'generating'
    check (status in ('generating', 'ready', 'failed')),
  news jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  tutor_questions jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null references public.daily_lessons (date) on delete cascade,
  news_read smallint[] not null default '{}',
  quiz_answers jsonb not null default '[]'::jsonb,
  quiz_done boolean not null default false,
  quiz_score smallint,
  tutor_done boolean not null default false,
  tutor_feedback jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, date),
  check (news_read <@ array[0, 1, 2]::smallint[]),
  check (quiz_score is null or quiz_score between 0 and 4)
);

-- ---------------------------------------------------------------------------
-- Streak & Pathway
-- ---------------------------------------------------------------------------

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  jokers_available smallint not null default 0 check (jokers_available between 0 and 1),
  run_started_on date,
  last_completed_date date,
  last_evaluated_date date,
  joker_used_on date,
  joker_notice_seen boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Nur die Spielerin hat eine Streak. Wird beim Anlegen und bei Rollenwechsel aufgerufen.
create function public.ensure_player_streak(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = p_user_id and role = 'player') then
    insert into public.streaks (user_id) values (p_user_id) on conflict do nothing;
  else
    delete from public.streaks where user_id = p_user_id;
  end if;
end;
$$;

-- Ein Eintrag pro ausgewertetem Tag: Grundlage für den Pathway.
create table public.streak_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  result text not null check (result in ('completed', 'joker', 'missed', 'no_lesson')),
  streak_after integer not null check (streak_after >= 0),
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------
-- Belohnungen
-- ---------------------------------------------------------------------------

create table public.reward_types (
  type text primary key check (type in ('massage', 'surprise', 'dinner')),
  title text not null,
  description text not null default '',
  interval_days integer not null check (interval_days > 0),
  updated_at timestamptz not null default now()
);

insert into public.reward_types (type, title, description, interval_days) values
  ('massage', 'Massage', 'Eine entspannte Massage von Benedikt.', 14),
  ('surprise', 'Überraschung von Benedikt', 'Lass dich überraschen!', 30),
  ('dinner', 'Essenseinladung', 'Benedikt lädt dich zum Essen ein.', 50);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null references public.reward_types (type),
  milestone_day integer not null check (milestone_day > 0),
  -- Bindet den Gutschein an eine Streak-Runde: nach einem Reset kann derselbe
  -- Meilenstein erneut verdient werden, innerhalb einer Runde nie doppelt.
  streak_run_started_on date not null,
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  redeemed_at timestamptz,
  fulfilled_at timestamptz,
  unique (user_id, type, milestone_day, streak_run_started_on),
  check (fulfilled_at is null or redeemed_at is not null)
);
create index rewards_user_idx on public.rewards (user_id, earned_at desc);

-- Spielerin löst einen eigenen, verdienten Gutschein ein.
create function public.redeem_reward(p_reward_id uuid)
returns public.rewards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward public.rewards;
begin
  update public.rewards
     set redeemed_at = now()
   where id = p_reward_id
     and user_id = (select auth.uid())
     and redeemed_at is null
  returning * into v_reward;

  if v_reward.id is null then
    raise exception 'Gutschein nicht gefunden oder bereits eingelöst';
  end if;
  return v_reward;
end;
$$;

-- Admin markiert einen eingelösten Gutschein als erfüllt.
create function public.fulfill_reward(p_reward_id uuid)
returns public.rewards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward public.rewards;
begin
  if not public.is_admin() then
    raise exception 'Nur für Admin';
  end if;

  update public.rewards
     set fulfilled_at = now()
   where id = p_reward_id
     and redeemed_at is not null
     and fulfilled_at is null
  returning * into v_reward;

  if v_reward.id is null then
    raise exception 'Gutschein nicht gefunden, nicht eingelöst oder bereits erfüllt';
  end if;
  return v_reward;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vokabeln & Knowledge
-- ---------------------------------------------------------------------------

create table public.vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_en text not null check (length(trim(word_en)) > 0),
  translation_de text not null default '',
  explanation text not null default '',
  example text not null default '',
  source_date date,
  correct_streak integer not null default 0 check (correct_streak >= 0),
  times_wrong integer not null default 0 check (times_wrong >= 0),
  learned boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index vocab_user_word_idx on public.vocab (user_id, lower(word_en));

create table public.knowledge_nuggets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  nugget text not null check (length(trim(nugget)) > 0),
  source_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_nuggets_user_idx on public.knowledge_nuggets (user_id, created_at desc);

-- Trigger erst nach allen Tabellen anlegen (die Funktionen schreiben in streaks).
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.handle_user_role_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Schreibzugriffe der Jobs laufen mit dem Service-Role-Key und umgehen RLS.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.daily_lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.streaks enable row level security;
alter table public.streak_days enable row level security;
alter table public.reward_types enable row level security;
alter table public.rewards enable row level security;
alter table public.vocab enable row level security;
alter table public.knowledge_nuggets enable row level security;

-- profiles: eigenes Profil lesen; Admin liest alle. Keine Updates (Rolle ist geschützt).
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- push_subscriptions: nur eigene Geräte.
create policy "push: own" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- daily_lessons: für alle angemeldeten lesbar, Schreiben nur serverseitig.
create policy "lessons: read" on public.daily_lessons
  for select to authenticated
  using (true);

-- lesson_progress: Spielerin verwaltet ihren eigenen Fortschritt; Admin liest.
create policy "progress: read own or admin" on public.lesson_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "progress: insert own" on public.lesson_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "progress: update own" on public.lesson_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- streaks / streak_days: nur lesen (eigene oder Admin); Schreiben über den Nacht-Job.
create policy "streaks: read own or admin" on public.streaks
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "streak_days: read own or admin" on public.streak_days
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- reward_types: alle lesen, Admin bearbeitet die Texte.
create policy "reward_types: read" on public.reward_types
  for select to authenticated
  using (true);
create policy "reward_types: admin update" on public.reward_types
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- rewards: lesen (eigene oder Admin). Statuswechsel nur über redeem_reward / fulfill_reward.
create policy "rewards: read own or admin" on public.rewards
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- vocab / knowledge_nuggets: vollständig privat.
create policy "vocab: own" on public.vocab
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "knowledge: own" on public.knowledge_nuggets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Funktionen: nur angemeldete Nutzer dürfen sie aufrufen.
revoke execute on function public.redeem_reward(uuid) from public, anon;
revoke execute on function public.fulfill_reward(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_role_change() from public, anon, authenticated;
revoke execute on function public.ensure_player_streak(uuid) from public, anon, authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.fulfill_reward(uuid) to authenticated;

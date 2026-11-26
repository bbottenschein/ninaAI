-- NinAI – Phase 3: Tageslimit für Sprachaufnahmen im Tutor-Gespräch.
-- Gezählt werden die Sekunden, die an die Spracherkennung (OpenAI) gehen.
-- Die Sprachausgabe läuft im Browser und kostet nichts.

create table public.voice_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  audio_seconds numeric(8, 1) not null default 0 check (audio_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.voice_usage enable row level security;

create policy "voice_usage: read own or admin" on public.voice_usage
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.voice_usage to authenticated;
grant all on public.voice_usage to service_role;

-- Bucht Aufnahme-Sekunden, wenn das Tageslimit es zulässt. Atomar, damit auch
-- schnelle Mehrfach-Aufnahmen das Limit nicht überschreiten. true = gebucht.
create function public.consume_voice_seconds(
  p_user_id uuid,
  p_date date,
  p_seconds numeric,
  p_limit_seconds numeric
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric;
begin
  if p_seconds <= 0 or p_seconds > p_limit_seconds then
    return false;
  end if;

  insert into public.voice_usage as v (user_id, date, audio_seconds)
  values (p_user_id, p_date, p_seconds)
  on conflict (user_id, date) do update
    set audio_seconds = v.audio_seconds + p_seconds,
        updated_at = now()
    where v.audio_seconds + p_seconds <= p_limit_seconds
  returning v.audio_seconds into v_total;

  return v_total is not null;
end;
$$;

revoke execute on function public.consume_voice_seconds(uuid, date, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.consume_voice_seconds(uuid, date, numeric, numeric)
  to service_role;

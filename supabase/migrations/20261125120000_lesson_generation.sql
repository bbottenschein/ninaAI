-- NinAI – Phase 2: Erzeugung der Tageslektion, Lesefortschritt und geplante Jobs.
-- Siehe SPEC.md › Geplante Jobs und › Tagesablauf.

-- ---------------------------------------------------------------------------
-- Sperre gegen doppelte Erzeugung
-- ---------------------------------------------------------------------------

alter table public.daily_lessons
  add column attempts smallint not null default 0 check (attempts >= 0),
  add column generation_started_at timestamptz;

-- Beansprucht die Erzeugung der Lektion für einen Tag. Gibt true zurück, wenn der
-- Aufrufer jetzt erzeugen darf. Das ist der Fall, wenn
--   * es für den Tag noch keine Zeile gibt,
--   * der letzte Versuch fehlgeschlagen ist und noch Versuche übrig sind oder
--   * eine laufende Erzeugung hängen geblieben ist (älter als p_stale_seconds).
-- Ein einziges INSERT … ON CONFLICT macht das atomar: Morgen-Job und
-- On-Demand-Fallback können nie gleichzeitig erzeugen.
create function public.claim_lesson_generation(
  p_date date,
  p_max_attempts integer,
  p_stale_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed date;
begin
  insert into public.daily_lessons as l (date, status, attempts, generation_started_at)
  values (p_date, 'generating', 1, now())
  on conflict (date) do update
    set status = 'generating',
        attempts = l.attempts + 1,
        generation_started_at = now(),
        error = null,
        updated_at = now()
    where l.attempts < p_max_attempts
      and (
        l.status = 'failed'
        or (
          l.status = 'generating'
          and l.generation_started_at < now() - make_interval(secs => p_stale_seconds)
        )
      )
  returning l.date into v_claimed;

  return v_claimed is not null;
end;
$$;

revoke execute on function public.claim_lesson_generation(date, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_lesson_generation(date, integer, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- Lesefortschritt: eine Meldung als gelesen markieren
-- ---------------------------------------------------------------------------

-- Läuft mit den Rechten der Spielerin (SECURITY INVOKER) und damit über RLS.
-- Fügt den Index atomar hinzu, ohne Dubletten.
create function public.mark_news_read(p_date date, p_index smallint)
returns smallint[]
language sql
security invoker
set search_path = ''
as $$
  insert into public.lesson_progress as lp (user_id, date, news_read)
  values ((select auth.uid()), p_date, array[p_index])
  on conflict (user_id, date) do update
    set news_read = (
          select array_agg(distinct x order by x)
          from unnest(lp.news_read || p_index) as x
        ),
        updated_at = now()
  returning news_read;
$$;

revoke execute on function public.mark_news_read(date, smallint) from public, anon;
grant execute on function public.mark_news_read(date, smallint) to authenticated;

-- ---------------------------------------------------------------------------
-- Geplante Jobs: pg_cron + pg_net rufen /api/jobs/* der Next.js-App auf
-- ---------------------------------------------------------------------------
-- URL und Secret liegen im Supabase Vault (siehe README › Geplante Jobs):
--   select vault.create_secret('https://<app>.vercel.app', 'ninaai_app_url');
--   select vault.create_secret('<JOBS_SECRET>', 'ninaai_jobs_secret');
-- Fehlen sie (z. B. lokal), tut der Aufruf nichts.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function public.call_job(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'ninaai_app_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'ninaai_jobs_secret';

  if v_url is null or v_secret is null then
    raise notice 'call_job(%): Vault-Secrets ninaai_app_url / ninaai_jobs_secret fehlen', p_path;
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || p_path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
end;
$$;

revoke execute on function public.call_job(text) from public, anon, authenticated;

-- Morgen-Job: stündlich. Die Route arbeitet erst ab 05:00 Uhr deutscher Zeit und nur,
-- wenn die Lektion des Tages noch fehlt (idempotent, übersteht Sommer-/Winterzeit).
select cron.schedule('ninaai-morning', '0 * * * *', $$select public.call_job('/api/jobs/morning')$$);

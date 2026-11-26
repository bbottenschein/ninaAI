-- NinAI – Journal, Phase J3: PIN, Monthly Review.

-- Optionale PIN für den Journal-Tab: nur als Hash (scrypt mit Salt) gespeichert.
alter table public.user_settings
  add column journal_pin_hash text,
  add column journal_pin_failed smallint not null default 0 check (journal_pin_failed >= 0),
  add column journal_pin_locked_until timestamptz;

-- Monthly Review: stündlich (50 nach) prüfen, ob ab dem Monatsersten 07:00 ein Rückblick
-- für den Vormonat fehlt. Idempotent; kein Push, der Rückblick erscheint in der Mood Overview.
select cron.schedule('ninaai-journal-review', '50 * * * *', $$select public.call_job('/api/jobs/journal-review')$$);

-- Rückblicke kann die Besitzerin beim vollständigen Löschen des Journals entfernen.
create function public.delete_own_journal_reviews()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.journal_reviews where user_id = (select auth.uid());
$$;

revoke execute on function public.delete_own_journal_reviews() from public, anon;
grant execute on function public.delete_own_journal_reviews() to authenticated;

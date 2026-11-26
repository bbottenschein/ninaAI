-- NinAI – Phase 4: Nacht-Job, Joker-Hinweis und gesehene Gutscheine.

-- Spielerin bestätigt den Hinweis „Dein Joker hat … deine Streak gerettet“.
create function public.dismiss_joker_notice()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.streaks set joker_notice_seen = true, updated_at = now()
   where user_id = (select auth.uid());
$$;

-- Spielerin hat die Freischalt-Animation ihrer neuen Gutscheine gesehen.
create function public.mark_rewards_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.rewards set seen_at = now()
   where user_id = (select auth.uid()) and seen_at is null;
$$;

revoke execute on function public.dismiss_joker_notice() from public, anon;
revoke execute on function public.mark_rewards_seen() from public, anon;
grant execute on function public.dismiss_joker_notice() to authenticated;
grant execute on function public.mark_rewards_seen() to authenticated;

-- Nacht-Job: stündlich (5 Minuten nach der vollen Stunde). Er wertet nur abgeschlossene
-- Tage aus, die noch offen sind – nach 00:00 Uhr deutscher Zeit also den Vortag.
select cron.schedule('ninaai-nightly', '5 * * * *', $$select public.call_job('/api/jobs/nightly')$$);

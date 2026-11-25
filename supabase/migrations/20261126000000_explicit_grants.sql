-- NinAI – explizite Tabellenrechte für die Data API.
-- Neuere Supabase-Projekte geben neuen Tabellen nicht mehr automatisch Rechte für
-- die Rollen authenticated / service_role. Ohne diese Rechte scheitert jede Abfrage
-- schon vor der Row Level Security (z. B. „permission denied for table profiles“).
-- Welche Zeilen jemand sieht, regelt weiterhin RLS.

grant usage on schema public to anon, authenticated, service_role;

-- Lesen: alle Tabellen (RLS filtert auf eigene Daten bzw. Admin).
grant select on all tables in schema public to authenticated;

-- Schreiben nur dort, wo es RLS-Policies dafür gibt.
grant insert, update on public.lesson_progress to authenticated;
grant update on public.reward_types to authenticated;
grant insert, update, delete on public.vocab to authenticated;
grant insert, update, delete on public.knowledge_nuggets to authenticated;
grant insert, update, delete on public.push_subscriptions to authenticated;

-- Jobs und Skripte (Secret Key) dürfen alles; sie umgehen RLS ohnehin.
grant all on all tables in schema public to service_role;

-- Wird in den RLS-Policies aufgerufen.
grant execute on function public.is_admin() to authenticated;

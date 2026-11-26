-- Einstellungen S1 (SPEC-settings.md): Push-Benachrichtigungen einzeln abschaltbar (Standard: an).
-- Der Tagesüberblick hat schon seine eigene Spalte (daily_overview, Standard: aus).

alter table public.user_settings
  add column push_love_notes boolean not null default true,
  add column push_learning boolean not null default true,
  add column push_reminders boolean not null default true,
  add column push_rewards boolean not null default true;

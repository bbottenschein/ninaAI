-- NinAI – Journal, Phase J2: Englisch-Feedback abschaltbar (standardmäßig an).
alter table public.user_settings
  add column journal_feedback boolean not null default true;

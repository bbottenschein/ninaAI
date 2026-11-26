-- Einstellungen S2 (SPEC-settings.md): Design pro Konto.
alter table public.user_settings
  add column theme text not null default 'flower'
    check (theme in ('flower', 'clean', 'dark', 'cat', 'auto'));

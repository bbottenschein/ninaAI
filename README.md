# NinAI

Private Englisch-Lern-App als PWA: jeden Tag 3 politische News, ein Quiz und ein
kurzes Gespräch mit einem KI-Tutor – mit Streak und Belohnungen.
Spezifikation: [SPEC.md](SPEC.md) · Projektregeln: [CLAUDE.md](CLAUDE.md)

## Lokal starten

Voraussetzungen: Node.js 22+, Docker (für die lokale Supabase).

```bash
npm install
npx supabase start        # startet Postgres + Auth lokal und wendet die Migrationen an
```

`supabase start` gibt am Ende `API_URL`, `PUBLISHABLE_KEY` und `SECRET_KEY` aus.
Lege damit `.env.local` an (Vorlage: `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<SECRET_KEY>
ANTHROPIC_API_KEY=<Claude-API-Key>
JOBS_SECRET=<beliebiger langer Zufallswert>
OPENAI_API_KEY=<OpenAI-Key, für die Spracherkennung im Tutor-Gespräch>
```

Zwei Testkonten anlegen:

```bash
node --env-file=.env.local scripts/create-user.mjs --email nina@test.local --password test-nina-123 --name Nina --role player
node --env-file=.env.local scripts/create-user.mjs --email benedikt@test.local --password test-ben-123 --name Benedikt --role admin
```

App starten und auf http://localhost:3000 öffnen:

```bash
npm run dev
```

## Live-Setup (Supabase + Vercel)

1. Auf supabase.com ein Projekt anlegen (Region Frankfurt, `eu-central-1`).
2. Migrationen einspielen: `npx supabase login`, `npx supabase link --project-ref <ref>`,
   `npx supabase db push`.
3. In Supabase unter *Authentication → Sign In / Providers* „Allow new users to sign up“
   **ausschalten** – Konten werden nur per Skript angelegt.
4. Die zwei echten Konten mit `scripts/create-user.mjs` anlegen (mit URL und Secret Key des
   Live-Projekts in einer separaten Env-Datei, die nicht committet wird).
5. Auf vercel.com das GitHub-Repo importieren und die Variablen
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `JOBS_SECRET` und `OPENAI_API_KEY` setzen.
6. Geplante Jobs verbinden (siehe unten).

## Geplante Jobs

`pg_cron` ruft stündlich zwei Routen auf:

- `POST /api/jobs/morning` (zur vollen Stunde): erzeugt ab 05:00 Uhr deutscher Zeit die
  Lektion des Tages, falls sie noch fehlt.
- `POST /api/jobs/nightly` (5 nach): wertet alle abgeschlossenen, noch offenen Tage aus –
  Streak, Joker, Pathway (`streak_days`) und Gutscheine. Nach Mitternacht also den Vortag;
  fällt ein Lauf aus, holt der nächste die Tage nach. URL und Secret liegen im Supabase Vault –
einmalig im SQL-Editor des Live-Projekts ausführen:

```sql
select vault.create_secret('https://<app>.vercel.app', 'ninaai_app_url');
select vault.create_secret('<JOBS_SECRET>', 'ninaai_jobs_secret');
```

Fehlen die Secrets (z. B. lokal), tut der Cron-Job nichts. Die Läufe stehen in
`cron.job_run_details`, die Antworten in `net._http_response`.

Lektion manuell anstoßen (lokal oder live):

```bash
curl -X POST -H "Authorization: Bearer $JOBS_SECRET" http://localhost:3000/api/jobs/morning
curl -X POST -H "Authorization: Bearer $JOBS_SECRET" http://localhost:3000/api/jobs/nightly
```

Unabhängig vom Job wird die Lektion beim Öffnen der App erzeugt, falls sie noch fehlt
(On-Demand-Fallback). Eine Datenbank-Sperre verhindert doppelte Erzeugung; nach drei
Fehlversuchen gilt der Tag als „ohne Lektion“ (neutral für die Streak). Den letzten Fehler
zeigt `select date, status, attempts, error from daily_lessons order by date desc;`.

## Tests

```bash
npm test
npm run typecheck
npm run lint
```

# NinAI – Projektregeln

Private App (PWA) für Nina, Admin ist Benedikt. Module: „Daily Learning“ (Englisch & Politik,
Spezifikation in `SPEC.md`), „Remind me“ (To-dos, `SPEC-remind-me.md`) „Journal“
(`SPEC-journal.md`) und Extras (Love Notes, Schütteln; `SPEC-extras.md`) – vor größeren Änderungen lesen.

@AGENTS.md

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4), gehostet auf Vercel.
  `cacheComponents` ist bewusst **aus**: Jede Seite hängt vom Login ab und wird pro Request gerendert.
- Supabase: Postgres mit Row Level Security, Auth (E-Mail + Passwort, 2 Konten).
- Claude API für alle generierten Texte, OpenAI Whisper + TTS für die Sprache (ab Phase 3).
- Geplante Jobs: Supabase `pg_cron` + `pg_net` ruft geschützte Routen unter `/api/jobs/*` auf
  (Header `Authorization: Bearer $JOBS_SECRET`). Die Job-Logik liegt in TypeScript, nicht in Edge Functions.

## Zeitzone

Alle Tagesgrenzen gelten in **Europe/Berlin**. Immer `berlinDate()` / `addDays()` aus
`src/lib/date.ts` verwenden, nie `new Date().toISOString().slice(0, 10)`.
Cron läuft in UTC: Jobs laufen stündlich und sind idempotent, statt auf eine feste UTC-Stunde zu setzen.

## Ordnerstruktur

- `src/app/` – nur Routing: Seiten sind dünn und rufen Feature-Komponenten auf.
  - `(app)/` – alles hinter dem Login, mit Tab-Leiste.
  - `(app)/(learn)/` – Daily Learning mit Unter-Tabs (Lektion, Vokabeln, Knowledge, Success).
  - `login/` – öffentlich.
- `src/features/<modul>/` – ein Ordner pro Feature-Modul (`home`, `today`, `news`, `lesson`, `quiz`, `tutor`, `vocab`, `knowledge`, `streak`, `remind`, `journal`, `extras`, `notifications`,
  `rewards`, `admin`, `auth`, `shell`). Komponenten, Server Actions, Queries und reine Logik
  des Moduls liegen dort. Ein neues Feature = neuer Ordner + Eintrag in `src/features/shell/tabs.ts`.
- `src/lib/` – modulübergreifende Helfer (Supabase-Clients, Datum, Env).
- `supabase/migrations/` – Datenbankschema. Änderungen immer als **neue** Migration,
  bereits deployte Migrationen nie bearbeiten.
- `scripts/` – Admin-Skripte (z. B. Konten anlegen).

## Regeln

- API-Schlüssel nur serverseitig. Nur `NEXT_PUBLIC_SUPABASE_URL` und
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dürfen in den Browser.
- Datenzugriff aus dem Browser läuft immer mit dem Nutzer-Token und damit über RLS.
  Der Secret Key (`SUPABASE_SECRET_KEY`) wird nur in Jobs und Skripten verwendet.
- „Remind me“ und „Journal“ sind privat: RLS nur für die Besitzerin, der Admin bekommt keinen Zugriff.
- Das Journal hat bewusst keine Pushes, keine Streak und keine Zähler.
- Das Schütteln (Blütenregen) ist ein Easter Egg: kein Hinweis darauf in Ninas UI, Menüs oder Texten.
- Rollen stehen in `profiles.role` und werden nur über `app_metadata` gesetzt
  (`scripts/create-user.mjs`), nie aus dem Client.
- Statuswechsel von Gutscheinen nur über die DB-Funktionen `redeem_reward` / `fulfill_reward`.
- Reine Logik (Streak, Meilensteine, Schrittfolge) als pure Funktionen mit Vitest-Tests
  neben der Datei (`*.test.ts`). Die Streak-Logik muss vollständig getestet sein.
- UI-Texte auf Deutsch, Lerninhalte auf Englisch (B1). Mobile first.

## Befehle

- `npm run dev` – Entwicklungsserver
- `npm test` – Unit-Tests (Vitest)
- `npm run typecheck` / `npm run lint` / `npm run build`
- `npx supabase start` – lokale Supabase (Docker), wendet die Migrationen an
- `npx supabase db reset` – lokale DB neu aufsetzen

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
   `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` setzen.

## Tests

```bash
npm test
npm run typecheck
npm run lint
```

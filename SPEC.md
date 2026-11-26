# NinAI – Projekt-Spezifikation

Stand: 25.11.2026 · Autor: Benedikt

> Diese Fassung basiert auf der ursprünglichen Spezifikation (PDF) und enthält die
> im Review vereinbarten Präzisierungen. Diese sind mit **[Review]** markiert.

## Überblick

NinAI ist eine private Lern-App für Benedikts Freundin: Jeden Tag liest sie drei
politische News in einfachem Englisch, beantwortet ein Quiz und führt ein kurzes
Gespräch mit einem KI-Tutor. Eine Streak mit echten Belohnungen von Benedikt sorgt
dafür, dass sie dranbleibt.

- **Nutzerin:** Benedikts Freundin (Nina). Benedikt hat einen Admin-Zugang.
- **Ziel:** Englisch verbessern und politisch auf dem Laufenden bleiben, in etwa 10 Minuten pro Tag.
- **Prinzipien:** kurz und schaffbar, verständlich statt fachsprachlich, neutral formuliert, modular erweiterbar.
- **Plattform:** Web-App, die sich auf dem Handy wie eine App installieren lässt (PWA).

## Tagesablauf

Ein Tag gilt als absolviert, wenn alle drei Schritte in dieser Reihenfolge
abgeschlossen sind. Erst dann steigt die Streak.

1. **News des Tages:** 3 Meldungen lesen (jede einzeln als gelesen markiert).
2. **Quiz of the Day:** 4 Fragen zu den 3 News beantworten. Es zählt das Beantworten, nicht die Punktzahl.
3. **Tutor-Gespräch:** ca. 2 Minuten, der Tutor stellt 2–3 Fragen.

- Schritte werden nacheinander freigeschaltet. Der Fortschritt bleibt gespeichert, wenn sie die App zwischendurch schließt.
- Der Tag läuft von 00:00 bis 23:59 Uhr deutscher Zeit (Europe/Berlin).
- Vokabelsammlung und Knowledge Section sind jederzeit nutzbar, zählen aber nicht zur Streak.
- **[Review] Verfügbarkeit:** Die Tageslektion ist ab 00:00 Uhr verfügbar. Der Morgen-Job
  um 05:00 erzeugt sie regulär; öffnet Nina die App vorher (oder ist der Job
  fehlgeschlagen), wird die Lektion beim Öffnen erzeugt (On-Demand-Fallback, mit
  Sperre gegen doppelte Erzeugung).
- **[Review] Tag ohne Lektion:** Konnte für einen Tag keine Lektion erzeugt werden
  (z. B. Ausfall von Feeds oder API), zählt dieser Tag **nicht** als verpasst. Er
  ist neutral: Streak bleibt, kein Joker wird verbraucht.

## News des Tages

Jeden Morgen werden 3 politische Meldungen ausgewählt: 2 aus Deutschland, 1
international. Jede liegt auf Englisch und Deutsch vor.

### Auswahl

- Quellen: die Politik-Feeds aus dem bestehenden News-Dashboard (Repo `bbottenschein/news-dashboard`,
  Tabelle `sources` in `supabase/migrations/0001_init.sql`) plus CNBC Politics. **[Review] Festgelegt:**

  | Region | Quelle | Feed | Status (getestet 25.11.2026) |
  |---|---|---|---|
  | DE | tagesschau Innenpolitik | `https://www.tagesschau.de/inland/innenpolitik/index~rss2.xml` | direkt ok |
  | DE | ZEIT Politik | `https://newsfeed.zeit.de/politik/index` | direkt ok |
  | DE | SZ Politik | `https://rss.sueddeutsche.de/rss/Politik` | direkt ok |
  | Int. | BBC World (Hauptquelle) | `https://feeds.bbci.co.uk/news/world/rss.xml` | direkt ok |
  | Int. | POLITICO Europe | `https://www.politico.eu/feed/` | 403 (Bot-Schutz) → Google News `site:politico.eu` |
  | Int. | CNBC Politics | `https://www.cnbc.com/id/10000113/device/rss/rss.html` | 403 (Akamai) → Google News `site:cnbc.com politics` |

  Ersatzweg wie im Dashboard: Liefert ein Feed nichts, wird
  `https://news.google.com/rss/search?q=when:24h+<query>&hl=…` abgefragt. Google-News-Einträge
  haben nur die Schlagzeile, keinen Artikeltext – für die ausgewählten Meldungen muss genug
  Quelltext vorliegen (Regel „Ämter nur aus dem Quelltext“), daher BBC World als Hauptquelle.
  Feed-Code liegt in `src/lib/news/` (`feed.ts`, `normalize.ts`, `article.ts`).
  **[Umsetzung Phase 2]** Den Artikeltext liefern derzeit nur tagesschau und BBC: ZEIT untersagt
  automatisierte Zugriffe ausdrücklich, SZ blockt sie (getestet 25.11.2026). Schlagzeilen von
  ZEIT, SZ, POLITICO und CNBC gehen nur als Kontext in das Relevanz-Ranking ein.
- Die KI rankt die Schlagzeilen des Vortags und Morgens nach politischer Relevanz und
  wählt 2 deutsche + 1 internationale Meldung. Keine Dubletten zum Vortag.

### Darstellung pro Meldung

- Titel, 4–6 kurze Sätze Text, Quelle mit Link.
- Toggle EN/DE oben auf der Seite. Englisch ist Standard. Beide Versionen werden im
  Morgen-Job gleichzeitig erzeugt, der Wechsel lädt sofort.
- **Begriffe:** Politische Fachbegriffe (z. B. „Koalitionsausschuss“, „Vermittlungsausschuss“)
  sind markiert. Ein Tipp öffnet eine kurze Erklärung in einfacher Sprache.
- **Personen:** Jede Person wird mit Namen und aktuellem Amt genannt, z. B. „Lars Klingbeil
  (Vice Chancellor and Finance Minister)“. Ein Tipp auf den Namen bietet „Zu Knowledge hinzufügen“ an.
- **Vokabeln:** Pro Meldung werden 3–5 schwierigere englische Wörter markiert und
  automatisch in die Vokabelsammlung übernommen.

### Stilregeln für die KI

- Neutral und ausgewogen, keine Wertung, keine Meinung, keine zugespitzten Formulierungen.
- Englisch auf Niveau B1: kurze Sätze, häufige Wörter, Hintergrund in einem Satz erklärt.
- **Ämter nur aus dem Quelltext:** Funktionen und Ämter werden aus dem aktuellen Artikel
  übernommen, nicht aus dem Modellwissen. Ist ein Amt im Artikel nicht genannt, wird es
  weggelassen statt geraten.

## Quiz of the Day

Nach den News folgen 4 Multiple-Choice-Fragen zu den 3 Meldungen, gemischt aus
leichten und schwereren Fragen.

- Mindestens eine Frage pro Meldung.
- Schwierigkeitsmix: 2 leicht (Kerninhalt), 1 mittel (Zusammenhang), 1 schwer (Detail, z. B. „Welches Amt hat Lars Klingbeil?“).
- Jede Frage ist nur mit dem Inhalt der 3 Meldungen beantwortbar.
- 4 Antwortmöglichkeiten, eine richtig. Nach jeder Antwort kommt eine kurze Erklärung.
- Fragen und Erklärungen folgen dem EN/DE-Toggle.
- Am Ende: Ergebnis (z. B. 3/4) und Hinweis, dass jetzt das Gespräch mit dem Tutor folgt.

## Tutor-Gespräch

Zum Abschluss spricht sie etwa 2 Minuten auf Englisch mit dem Tutor. Er stellt 2–3
Fragen zu den News des Tages.

- Sprachgesteuert: Mikrofon-Taste, Antwort des Tutors wird vorgelesen. Zusätzlich als Text sichtbar.
- Fragenmuster: 1 Verständnisfrage („What was the news about …?“), 1–2 Meinungs- oder
  Alltagsfragen („What do you think …?“, „How does this affect people in Germany?“).
- Ton: freundlich, geduldig, auf B1-Niveau. Fehler werden nicht während des Gesprächs unterbrochen.
- Abschluss-Feedback: 2 Dinge, die gut waren, und 1 konkreter Tipp mit korrigiertem Beispielsatz.
- Abgeschlossen, wenn alle Fragen beantwortet sind. Ein „Nochmal“-Button erlaubt eine
  Wiederholung ohne Einfluss auf die Streak.
- Fallback: Funktioniert das Mikrofon nicht, kann sie die Antworten tippen.
- **[Review] Technik:** Aufnahme im Browser (MediaRecorder), Spracherkennung serverseitig
  per OpenAI, Antwort per Claude. Die Browser-eigene Spracherkennung wird nicht genutzt
  (in iPhone-PWAs unzuverlässig).
- **[Umsetzung Phase 3]** OpenAI schaltet `whisper-1` am 26.02.2027 und alle TTS-Modelle am
  06.01.2027 ab. Daher: Spracherkennung mit `gpt-transcribe` (über `OPENAI_TRANSCRIBE_MODEL`
  tauschbar), Sprachausgabe mit der **Stimme des Geräts** (Web Speech API, bevorzugt
  amerikanische Frauenstimme, kostenlos). Tageslimit: **5 Minuten Aufnahme** (Tabelle
  `voice_usage`), danach geht es per Tippen weiter.

## Streak, Joker & Pathway

Jeder absolvierte Tag erhöht die Streak um 1. Alle 10 Streak-Tage gibt es einen Joker,
der einen verpassten Tag auffängt. Ein verpasster Tag ohne Joker setzt die Streak auf 0.

| Situation | Ergebnis |
|---|---|
| Tag absolviert | Streak +1 |
| Streak erreicht 10, 20, 30, … | +1 Joker (höchstens 1 gleichzeitig) |
| Tag verpasst, Joker vorhanden | Joker wird automatisch verbraucht, Streak bleibt gleich |
| Tag verpasst, kein Joker | Streak fällt auf 0 |
| **[Review]** Tag ohne Lektion (technischer Ausfall) | neutral: Streak bleibt, kein Joker verbraucht |

- **Prüfung:** Ein nächtlicher Job um 00:05 Uhr (Europe/Berlin) wertet den Vortag aus.
- **[Review] Nachholen:** Der Nacht-Job wertet alle Tage seit `last_evaluated_date` aus,
  nicht nur den Vortag. Fällt ein Lauf aus, holt der nächste die Tage nach.
- **[Review] Zeitzone:** Cron-Zeitpläne laufen in UTC. Damit 00:05 Berlin auch über die
  Sommer-/Winterzeit stimmt, läuft der Job stündlich und arbeitet nur, wenn es offene Tage gibt
  (idempotent).
- **Anzeige:** Aktuelle Streak, längste Streak, Joker-Status (verfügbar / verbraucht) und Tage bis zum nächsten Joker.
- **Hinweis:** Wurde ein Joker verbraucht, sieht sie das beim nächsten Öffnen („Dein Joker hat gestern deine Streak gerettet“).
- **[Review] Sofort-Anzeige:** Schließt sie den Tag ab, zeigt die App die Streak sofort um 1
  erhöht an (vorläufig); verbindlich gebucht wird sie vom Nacht-Job.

### Pathway

- Ein vertikaler Weg, auf dem jeder Streak-Tag ein Feld ist. Absolvierte Tage sind ausgefüllt, der heutige Tag hervorgehoben.
- Meilensteine (14, 28, 30, 42, 50, …) sind als Belohnungs-Symbole auf dem Weg markiert.
  Oben steht: „Noch X Tage bis zu deiner nächsten Belohnung“.
- Joker-Tage sind auf dem Weg als eigenes Symbol sichtbar.

## Belohnungen & Admin-Bereich

Drei Gutscheine von Benedikt werden an festen Streak-Meilensteinen freigeschaltet. Alle
drei wiederholen sich in ihrem Rhythmus, solange die Streak weiterläuft.

| Gutschein | Rhythmus | Erste Meilensteine |
|---|---|---|
| Massage | alle 14 Streak-Tage | 14, 28, 42, 56 |
| Überraschung von Benedikt | alle 30 Streak-Tage | 30, 60, 90 |
| Essenseinladung | alle 50 Streak-Tage | 50, 100, 150 |

- Fällt ein Tag auf mehrere Meilensteine (z. B. Tag 150), gibt es alle passenden Gutscheine.
- Verdiente Gutscheine bleiben erhalten, auch wenn die Streak später auf 0 fällt. Nach einem
  Reset zählen die Meilensteine ab der neuen Streak.
- **[Review]** Jeder Gutschein ist an eine Streak-Runde gebunden (`streak_run_started_on`).
  Dadurch kann derselbe Meilenstein (z. B. Massage an Tag 14) nach einem Reset erneut
  verdient werden, aber innerhalb einer Runde nie doppelt.
- Beim Freischalten: Vollbild-Animation mit dem Gutschein, danach liegt er unter „Meine Gutscheine“.

### Ablauf eines Gutscheins

1. **Verdient:** erscheint in „Meine Gutscheine“. Benedikt bekommt eine Benachrichtigung.
2. **Eingelöst:** sie tippt auf „Einlösen“. Benedikt bekommt eine Benachrichtigung.
3. **Erfüllt:** Benedikt markiert den Gutschein im Admin-Bereich als erledigt.

### Admin-Bereich (nur Benedikt)

- Liste aller Gutscheine mit Status (verdient / eingelöst / erfüllt) und Datum.
- Aktuelle Streak, Joker-Status und nächster Meilenstein.
- Gutschein-Texte bearbeiten (z. B. was die Überraschung andeutet). **[Review]** gespeichert in `reward_types`.

## Vokabelsammlung

Neue Wörter aus den News landen automatisch in ihrer Sammlung und können dort per Quiz
geübt werden. Das zählt nicht zur Streak.

- Eintrag: englisches Wort, deutsche Übersetzung, kurze Erklärung, Beispielsatz aus der Meldung, Datum.
- Zusätzlich manuell: Wörter in den News antippen und „Zur Sammlung hinzufügen“.
- Vokabel-Quiz: 10 Wörter pro Runde, wahlweise EN→DE oder DE→EN, Multiple Choice.
- Wörter, die sie oft falsch hat, kommen häufiger dran. Dreimal richtig hintereinander = „gelernt“.
- Suche und Filter (alle / neu / gelernt).

## Knowledge Section

Hier sammelt sie eigene Notizen als Paare aus Name und Knowledge Nugget, z. B.
Name: Lars Klingbeil, Knowledge Nugget: SPD-Vorsitzender und Finanzminister.

- Felder: Name (Pflicht), Knowledge Nugget (Pflicht), Datum (automatisch).
- Anlegen, bearbeiten, löschen. Suche über Name und Nugget.
- Schnell-Anlage aus den News: Tipp auf eine Person, dann „Zu Knowledge hinzufügen“. Name und Amt sind vorausgefüllt und editierbar.
- Sortierung: neueste zuerst oder alphabetisch.
- Später möglich: einzelne Nuggets als Bonusfrage im Quiz.

## Tech-Stack & Architektur

Next.js als PWA, Supabase für Login und Datenbank, Claude für alle Texte. Die
Tageslektion wird einmal erzeugt und gespeichert, nicht bei jedem Öffnen.

| Baustein | Umsetzung | Zweck |
|---|---|---|
| Frontend | Next.js (App Router, TypeScript) + Tailwind, als PWA | App auf dem Handy-Homescreen, ohne App Store |
| Hosting | Vercel | Deployment direkt aus GitHub |
| Login & Datenbank | Supabase (Postgres, Auth, Row Level Security) | 2 Konten: Spielerin und Admin |
| Geplante Jobs | **[Review]** Supabase `pg_cron` + `pg_net` ruft geschützte Next.js-Routen (`/api/jobs/*`) auf | Morgen-Job, Nacht-Job, Reminder – die ganze Logik bleibt in einer TypeScript-Codebasis und ist testbar |
| Texte & Quiz | Claude API | News-Auswahl, EN/DE-Texte, Begriffe, Quiz, Tutor, Feedback |
| Sprache | OpenAI Whisper (Spracherkennung) + OpenAI TTS (Sprachausgabe) | Tutor-Gespräch per Stimme |
| News | RSS-Feeds (aus dem News-Dashboard + politische Quellen) | Rohmaterial für die 3 Meldungen |
| Benachrichtigungen | Web Push, alternativ E-Mail | Reminder für sie, Gutschein-Info für Benedikt |

### Geplante Jobs (Europe/Berlin)

1. **05:00 Morgen-Job:** Feeds laden, Claude wählt 2 DE + 1 internationale Meldung, erzeugt EN- und
   DE-Texte, Begriffe, Personen mit Amt, Vokabeln, 4 Quizfragen und 2–3 Tutor-Fragen. Alles wird als
   Tageslektion gespeichert. **[Review]** Bei Fehler: erneuter Versuch; zusätzlich On-Demand-Erzeugung beim Öffnen.
2. **00:05 Nacht-Job:** Offene Tage auswerten, Streak und Joker aktualisieren, Meilensteine prüfen,
   Gutscheine anlegen, Benedikt benachrichtigen.
3. **19:00 Reminder:** Push an sie, wenn die Tageslektion noch offen ist.

### Hinweise

- Sprache: Für den Start reicht die Kette aus Spracherkennung, Claude und Sprachausgabe. Wirkt die
  Verzögerung störend, kann später auf eine Realtime-Voice-API gewechselt werden.
- API-Schlüssel liegen nur serverseitig. Ein Tageslimit für Sprach-Minuten begrenzt die Kosten.
- Web Push funktioniert auf dem iPhone nur, wenn die App zum Homescreen hinzugefügt wurde.
- Modular: Jedes Feature ist ein eigener Ordner und Tab. Neue Features kommen als weiteres Modul dazu.

## Datenmodell

**[Review]** Die ursprünglichen sieben Tabellen, ergänzt um `push_subscriptions`,
`reward_types` und `streak_days`. Das verbindliche Schema steht in `supabase/migrations/`.

| Tabelle | Wichtige Felder |
|---|---|
| profiles | id, name, role (player / admin), english_level |
| push_subscriptions **[Review]** | id, user_id, endpoint, p256dh, auth – ein Eintrag pro Gerät |
| daily_lessons | date (eindeutig), status (generating / ready / failed), news (JSON: 3 Meldungen mit title_en, text_en, title_de, text_de, source_url, region, terms[], persons[], vocab[]), quiz (JSON: 4 Fragen), tutor_questions (JSON) |
| lesson_progress | user_id, date, news_read (Liste der gelesenen Meldungen **[Review]**), quiz_answers, quiz_done, quiz_score, tutor_done, tutor_feedback, completed_at |
| streaks | user_id, current_streak, longest_streak, jokers_available (0–1), run_started_on **[Review]**, last_completed_date, last_evaluated_date, joker_used_on, joker_notice_seen |
| streak_days **[Review]** | user_id, date, result (completed / joker / missed / no_lesson), streak_after – Grundlage für den Pathway |
| reward_types **[Review]** | type (massage / surprise / dinner), title, description, interval_days – Texte im Admin editierbar |
| rewards | id, user_id, type, milestone_day, streak_run_started_on **[Review]**, earned_at, redeemed_at, fulfilled_at |
| vocab | id, user_id, word_en, translation_de, explanation, example, source_date, correct_streak, times_wrong, learned |
| knowledge_nuggets | id, user_id, name, nugget, created_at, source_date (optional) |

- Row Level Security: Die Spielerin sieht nur ihre eigenen Daten. Der Admin darf rewards, streaks,
  streak_days und lesson_progress lesen und Gutscheine als erfüllt markieren.
- daily_lessons sind für beide Konten lesbar, aber nur serverseitig (Jobs) schreibbar.
- **[Review]** Statuswechsel von Gutscheinen (einlösen / erfüllen) laufen über Datenbank-Funktionen,
  damit jede Rolle nur ihr eigenes Feld setzen kann.

## Umsetzung in Phasen

Sechs Phasen, jede endet mit einer nutzbaren Version. Nach Phase 3 kann sie die App schon täglich nutzen.

- [x] **Phase 1 – Grundgerüst:** Next.js-PWA, Supabase-Projekt, Login für 2 Konten, Tab-Navigation (Heute, Vokabeln, Knowledge, Gutscheine).
- [x] **Phase 2 – News des Tages:** Morgen-Job, News-Ansicht mit EN/DE-Toggle, Begriffs-Erklärungen, Personen mit Amt.
- [x] **Phase 3 – Quiz & Tutor:** Quiz of the Day, Tutor-Gespräch per Stimme mit Text-Fallback, Abschluss-Feedback, Tagesfortschritt.
- [ ] **Phase 4 – Streak & Belohnungen:** Nacht-Job, Streak- und Joker-Logik, Pathway, Gutscheine mit Einlösen, Admin-Bereich.
- [ ] **Phase 5 – Vokabeln & Knowledge:** automatische Vokabelübernahme, Vokabel-Quiz, Knowledge Section mit Schnell-Anlage aus den News.
- [ ] **Phase 6 – Feinschliff:** Push-Reminder, Benachrichtigungen für Benedikt, Animationen, App-Icon und Design.

Die Streak-Logik (Phase 4) wird mit Unit-Tests abgesichert, z. B. für „Joker verbraucht“,
„zweiter Fehltag“, „Meilenstein 150“ und „Reset und erneuter Meilenstein“.

## Annahmen & offene Punkte

- [x] Joker: höchstens 1 gleichzeitig. Ein verbrauchter Joker hält die Streak, erhöht sie aber nicht.
- [x] Nach einem Reset auf 0 lassen sich die Gutscheine erneut verdienen, sobald die Meilensteine wieder erreicht werden.
- [x] Für den Streak zählt das Abschließen des Quiz, nicht die Punktzahl.
- [x] Englisch-Niveau der Texte: B1. Später eventuell im Profil einstellbar.
- [x] **[Review]** Lektion ab 00:00 verfügbar, On-Demand-Fallback; Tag ohne Lektion ist neutral.
- [x] **[Review]** Sprache: OpenAI-Spracherkennung + Sprachausgabe des Geräts (siehe Tutor-Gespräch).
- [x] Stimme des Tutors: weiblich, amerikanisch (Stimme des Geräts).
- [x] **[Review]** Konkrete Quellen für die internationale Meldung: BBC World (Haupt), POLITICO Europe, CNBC Politics.
- [x] **[Review]** Feed-URLs aus dem bestehenden News-Dashboard (siehe News des Tages › Auswahl).
- [x] **[Review]** Anthropic-Key: als Umgebungsvariable `ANTHROPIC_API_KEY` (lokal `.env.local`, live in Vercel).
- [ ] Was passiert an Tagen mit wenig politischen News (z. B. Feiertage): Ersatz durch Wirtschaftsthemen?

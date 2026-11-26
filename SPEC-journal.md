# NinAI – Modul „Journal“

Stand: 26.11.2026 · Autor: Benedikt

> Übernommen aus dem Konzept-Dokument. Entscheidungen zu den offenen Punkten sind mit
> **[Entschieden]** markiert, Abweichungen bei der Umsetzung mit **[Umsetzung]**.

## Überblick

„Journal“ ist das dritte Modul in NinAI: Nina hält jeden Abend in ein paar Minuten auf Englisch
fest, wie ihr Tag war und wofür sie dankbar ist, und bewertet ihn auf einer Skala. Eine zweite
Ansicht zeigt, wie sich ihre Stimmung über die Zeit entwickelt.

- **Sections:** Daily Entry (Abend-Eintrag) und Mood Overview (Stimmungsverlauf und Rückblick).
- **Doppelter Nutzen:** Reflexion am Abend und Schreibübung auf Englisch. Neue Wörter fließen in die Vokabelsammlung von Daily Learning.
- **Design:** Farbpalette aus Daily Learning (rosa, clean, blumig).

### Navigation

| Tab | Inhalt |
|---|---|
| Home | Tagesstatus, ab 18:00 eine ruhige Karte „Write about your day“ ohne Status oder Zähler; nach dem Eintrag die Bewertung des Tages |
| Daily Learning | Lektion, Vokabeln, Knowledge, Success |
| Remind me | Eingabe, To-Do Overview |
| Journal | Daily Entry, Mood Overview |

## Daily Entry

Der Abend-Eintrag besteht aus einer Tagesbewertung und vier kurzen Fragen auf Englisch. Er dauert
etwa 3–5 Minuten. Pro Tag gibt es genau einen Eintrag.

**[Entschieden] Zeitfenster:** Der Eintrag eines Tages lässt sich bis **12:00 Uhr am Folgetag**
anlegen und bearbeiten (Nachtragen, falls sie abends zu müde war), danach ist er nur noch lesbar.

### 1. Tagesbewertung

- **[Entschieden]** Skala von **1 bis 10** als Slider, dargestellt als Blume, die mit höherem Wert weiter aufblüht.
- Beschriftung an den Enden: 1 = „Tough day“, 10 = „Amazing day“.
- Optional ein Stimmungswort aus einer kleinen Auswahl: happy, calm, grateful, tired, stressed, sad, excited.

### 2. Fragen

**[Entschieden]** Die vier Fragen bleiben wie im Konzept.

| Frage | Feld | Pflicht |
|---|---|---|
| How was your day? | Freitext, 3–5 Sätze | ja |
| What are you grateful for today? | 3 kurze Zeilen | ja (mind. 1) |
| What was the highlight of your day? | 1 Satz | nein |
| What do you want to focus on tomorrow? | 1 Satz | nein |

- Jede Frage hat einen kleinen Hilfe-Button mit Satzanfängen, z. B. „Today I …“, „I'm grateful for … because …“.
- Spracheingabe per Mikrofon-Taste, wie beim Tutor.
- Kein Wortzähler und kein Mindestumfang. Kurze Einträge sind ausdrücklich okay.

### 3. Speichern

- Nach dem Speichern erscheint das Englisch-Feedback (nächster Abschnitt, Phase J2).
- Vergangene Einträge sind nach dem Zeitfenster nur noch lesbar, nicht bearbeitbar.

## Englisch-Feedback

Nach dem Speichern gibt die KI kurzes, freundliches Feedback zum Englisch. Der Inhalt des Tages wird nicht bewertet.

- **Original bleibt erhalten:** Ihr Text wird gespeichert, wie sie ihn geschrieben hat. Die korrigierte Version erscheint daneben, Korrekturen sind farbig markiert.
- **Umfang:** höchstens 3 Korrekturen pro Eintrag, jeweils mit kurzer Erklärung. Dazu 1 Sache, die besonders gut war.
- **[Entschieden]** Erklärungen und Lob auf **Deutsch** (wie beim Tutor), die Korrekturen selbst auf Englisch.
- **Vokabeln:** Bis zu 3 bessere oder neue Ausdrücke werden vorgeschlagen und mit einem Tipp in die Vokabelsammlung übernommen.
- **Ton:** warm und ermutigend. Die KI kommentiert keine Gefühle, gibt keine Ratschläge zum Leben und stellt keine Diagnosen.
- **Abschaltbar:** In den Einstellungen kann sie das Feedback ausschalten, wenn sie einfach nur schreiben möchte.
- **[Umsetzung]** Schalter unten im Daily Entry (`user_settings.journal_feedback`, Standard an).
  Korrekturen werden gegen ihren Originaltext geprüft: nur Stellen, die wörtlich vorkommen, höchstens 3.
  Das Feedback gehört zu einer Fassung des Eintrags; nach einer Änderung wird es neu erzeugt.

## Mood Overview

Die zweite Section zeigt ihre Stimmung als Verlauf über die Tage aus den Abendbewertungen.

**[Entschieden]** Keine Mood Check-ins tagsüber. Damit entfällt die Ansicht „Heute“ mit Tagesverlauf
und die Tabelle `mood_checkins`.

**Zeitraum-Umschalter:** Woche / Monat / Jahr, dazu **🌸 Dankbar** für die Gratitude Wall.
Woche, Monat und Jahr lassen sich mit ‹ › blättern; im Jahr führt ein Tipp auf einen Monat zum Kalender.

| Ansicht | Darstellung | Datenquelle |
|---|---|---|
| Woche | Linie mit 7 Punkten, Durchschnitt als dünne Linie | Abendbewertungen |
| Monat | Kalender, jeder Tag in einem Rosaton je nach Bewertung | Abendbewertungen |
| Jahr | Kleine Kacheln für 12 Monate mit Monatsdurchschnitt | Abendbewertungen |

### Weitere Elemente

- **Tag antippen:** öffnet den Eintrag dieses Tages zum Lesen.
- **Kennzahlen:** Durchschnitt der Woche bzw. des Monats und der beste Tag. Bewusst keine Zähler für Einträge oder fehlende Tage.
- **Gratitude Wall:** alle Dankbarkeits-Einträge als Sammlung kleiner Karten, durchsuchbar. Gut für schlechtere Tage.
- **Monthly Review:** Am Monatsersten fasst die KI den Vormonat in einfachem Englisch zusammen: schönste Momente, häufige Dankbarkeits-Themen, Stimmungsverlauf. Immer positiv und beschreibend, ohne Bewertung oder Ratschläge.

## Kein Druck

Das Journal soll ein Ort zum Durchatmen sein, keine weitere Pflicht. Deshalb gibt es weder Push-Benachrichtigungen noch eine Streak.

- **Keine Pushes:** weder Abend-Erinnerung noch Check-in-Erinnerungen. Einziger Hinweis ist die ruhige Karte auf Home ab 18:00.
- **Keine Streak, keine Zähler:** Das Journal zählt nicht zur Daily-Learning-Streak. Es gibt keine Anzeige wie „X Einträge“ oder „X Tage verpasst“.
- **Lücken sind normal:** Tage ohne Eintrag bleiben im Kalender einfach leer, ohne Markierung.
- **Nachtragen:** Den Eintrag von gestern kann sie bis zum nächsten Mittag noch nachtragen, falls sie abends zu müde war.

## Privatsphäre

Das Journal ist streng privat. Benedikts Admin-Zugang sieht weder Einträge noch Bewertungen.

- Row Level Security: Journal-Tabellen sind nur für ihr Konto lesbar und schreibbar. Die Admin-Rolle bekommt keinen Zugriff, auch nicht auf Durchschnittswerte.
- Auch auf Home erscheint die Bewertung nur in ihrem Konto.
- **[Entschieden]** Optional: PIN für den Journal-Tab (standardmäßig aus), damit niemand mitliest, der ihr Handy in der Hand hat.
- Texte gehen für Feedback und Monthly Review an die Claude API. Ein Hinweis beim ersten Öffnen erklärt das in einem Satz.
- Export: Sie kann alle Einträge als Datei herunterladen und ihr Journal vollständig löschen.
- **[Umsetzung]** Einstellungen unten im Daily Entry („⚙️ Journal-Einstellungen“): Feedback-Schalter,
  PIN festlegen/ändern/entfernen, „Jetzt sperren“, Export als Markdown-Datei (`/api/journal/export`)
  und „Journal vollständig löschen“ (Bestätigung durch Eintippen von „LÖSCHEN“).
  PIN: 4 Ziffern, gespeichert als scrypt-Hash in `user_settings.journal_pin_hash`. Nach dem Entsperren
  gilt ein signiertes httpOnly-Cookie 10 Minuten. 5 Fehlversuche → 5 Minuten Pause.
  Ist eine PIN gesetzt, zeigt Home nur „written today“ ohne Bewertung. Vergessene PIN: Admin setzt
  `journal_pin_hash` im SQL-Editor auf `null` (die Einträge sieht er dabei nicht in der App).

## Datenmodell

| Tabelle | Wichtige Felder |
|---|---|
| journal_entries | id, user_id, date (eindeutig pro Nutzerin), rating (1–10), mood_word, day_text, gratitude (Liste, 1–3), highlight, tomorrow_focus, feedback (JSON: Korrekturen, Lob, Vokabelvorschläge), created_at, updated_at |
| journal_reviews | id, user_id, month, summary_en, stats (JSON: Durchschnitt, bester Tag), created_at |

### Jobs (Europe/Berlin)

1. **Monatserster 07:00 – Monthly Review:** Einträge des Vormonats an Claude, Ergebnis in journal_reviews speichern. Es wird kein Push verschickt, der Review erscheint beim nächsten Öffnen der Mood Overview.
   **[Umsetzung]** `/api/jobs/journal-review`, stündlich um :50; ab dem 1. um 07:00 holt er fehlende Rückblicke nach. Ohne Einträge im Vormonat kein Rückblick.

- Diagramme im Frontend aus journal_entries berechnen, keine eigene Statistik-Tabelle nötig.
- Das Journal nutzt keine Push-Benachrichtigungen und taucht nicht in der Streak-Logik auf.

## Umsetzung in Phasen

- [x] **Phase J1 – Daily Entry:** Journal-Tab in der Navigation, Tabellen mit RLS, Tagesbewertung mit Blumen-Slider, 4 Fragen mit Satzanfängen, Spracheingabe, ruhige Journal-Karte auf Home ab 18:00.
- [x] **Phase J2 – Feedback & Mood Overview:** Englisch-Feedback mit Original und Korrektur, Vokabelübernahme, Ansichten Woche / Monat / Jahr, Kennzahlen, Gratitude Wall, Tag antippen zum Lesen.
- [x] **Phase J3 – Extras:** Monthly Review, PIN für den Journal-Tab, Export und Löschen.

## Offene Punkte

- [x] Stimmung im Tagesverlauf: keine Check-ins, nur Abendbewertungen.
- [x] Skala: 1–10.
- [x] Fragen: die 4 aus dem Konzept.
- [x] PIN für den Journal-Tab: ja, optional (Phase J3).

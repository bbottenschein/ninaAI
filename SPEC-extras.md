# NinAI – Extras

Stand: 26.11.2026 · Autor: Benedikt

> Übernommen aus dem Konzept-Dokument. Entscheidungen zu den offenen Punkten sind mit
> **[Entschieden]** markiert, Abweichungen bei der Umsetzung mit **[Umsetzung]**.

## Überblick

Zwei kleine Extras machen NinAI persönlicher: **Love Notes** für kurze Nachrichten zwischen Nina und
Benedikt und ein **Blütenregen**, wenn Nina ihr Handy schüttelt.

| Extra | Wer nutzt es | Wo in der App |
|---|---|---|
| Love Notes | Nina und Benedikt, in beide Richtungen | Briefumschlag-Symbol oben rechts auf Home (beide Konten) |
| Schütteln | Nina | Überall in der App, als verstecktes Easter Egg |

- Design: Farbpalette aus Daily Learning (rosa, clean, blumig).
- Beide Extras zählen nicht zur Streak und erzeugen keine Zähler oder Pflichten.

## Love Notes

Nina und Benedikt können sich gegenseitig kurze Freitext-Nachrichten schicken. Jede Nachricht kommt
als Push aufs Handy und landet zusätzlich in einem kleinen Postfach in der App.

### Schreiben

- Ein Textfeld mit höchstens 150 Zeichen und einem Zähler, der ab 120 Zeichen sichtbar wird.
- Button „Senden“. Nach dem Senden eine kleine Herz-Animation als Bestätigung.
- Keine Bilder, keine Anhänge. Die Nachricht ist bewusst kurz.

### Empfangen

- **[Entschieden]** Push **ohne Nachrichtentext** (Sperrbildschirm): Titel „💌 Neue Love Note“, darunter „Tippe zum Lesen“.
- **[Entschieden]** Keine Ruhezeiten: Der Push kommt **immer sofort**.
- Ein Tipp auf den Push öffnet die Nachricht im Postfach.
- Auf Home zeigt das Briefumschlag-Symbol einen kleinen Punkt, solange eine Nachricht ungelesen ist.

### Postfach

- Alle Nachrichten in beide Richtungen, neueste oben, mit Datum und Uhrzeit.
- Empfangene und gesendete Nachrichten sind farblich unterschieden.
- Einzelne Nachrichten lassen sich als Favorit markieren und unter „Favorites“ wiederfinden.
- Keine Lesebestätigung für den Absender. So entsteht kein Druck, sofort zu antworten.
- **[Entschieden]** Jede Nachricht lässt sich löschen, **nur für mich**: Beim anderen bleibt sie im Postfach.
  Erst wenn beide gelöscht haben, wird sie ganz entfernt (`delete_love_note(id)`,
  Spalten `deleted_by_sender` / `deleted_by_recipient`).

### Voraussetzungen

- NinAI muss auf beiden Handys installiert sein (auf dem iPhone zum Homescreen hinzugefügt) und Mitteilungen müssen erlaubt sein.
- **[Entschieden]** Benedikt bekommt wie Nina einen **Briefumschlag oben rechts auf seiner Home-Seite** (Postfach und Senden) – keine eigene Ansicht im Admin-Bereich.

## Schütteln: Blütenregen

Wenn Nina ihr Handy schüttelt, regnet es Blüten über den Bildschirm, und ein kleines englisches
Kompliment erscheint. Sonst passiert nichts, es wird nichts verschickt.

### Ablauf

1. Nina schüttelt das Handy kräftig, z. B. 2–3 Bewegungen innerhalb einer Sekunde.
2. Etwa 3 Sekunden lang fallen rosa Blüten über den Bildschirm.
3. In der Mitte erscheint eine Karte mit einem Kompliment, z. B. „You light up every room you walk into.“
4. Die Karte verschwindet nach ein paar Sekunden oder mit einem Tipp.

### Komplimente

- Grundstock von 50 kurzen Komplimenten auf Englisch, einfach und warm (Niveau B1).
- Benedikt kann im Admin-Bereich eigene Komplimente hinzufügen, bearbeiten und deaktivieren.
- Kein Kompliment wiederholt sich, bevor alle anderen einmal dran waren.
- **[Entschieden]** Start mit den 50 Komplimenten; Benedikt ergänzt eigene später im Admin-Bereich.

### Technik

- Bewegungserkennung über die Bewegungssensoren des Browsers (DeviceMotion).
- Auf dem iPhone muss Nina den Zugriff auf die Bewegungssensoren einmal erlauben. Diese Abfrage ist nur nach einem Tipp möglich.
- **[Entschieden]** Einmalige, neutrale Karte auf Home „Erlaube Bewegungssensoren für kleine Animationen“
  (Erlauben / Nicht jetzt). Nach „Nicht jetzt“ bleibt eine kleine Zeile unter den Benachrichtigungen.
- Sperre von 10 Sekunden nach jedem Blütenregen, damit er nicht beim Gehen oder Joggen mehrfach auslöst.
- Ist „Bewegung reduzieren“ im Handy aktiviert, erscheint nur die Kompliment-Karte ohne Animation.
- Nicht aktiv während des Tutor-Gesprächs und während sie in Eingabefeldern tippt.
- **[Umsetzung]** Ein Schütteln = 3 Ausschläge über 14 m/s² (ohne Schwerkraft) innerhalb von 1 Sekunde
  (`src/features/extras/shake.ts`). Auch nicht aktiv, solange ein Vollbild-Dialog offen ist
  (z. B. Gutschein-Animation). Auswahl: zufällig unter den aktiven Komplimenten mit den wenigsten
  Anzeigen – neue Komplimente kommen dadurch zuerst dran.

**Geheimhaltung:** Das Schütteln ist ein Easter Egg. In der App steht nirgends ein Hinweis darauf, auch
nicht in Menüs oder Einstellungstexten. Die Erlaubnis-Abfrage läuft neutral. (Nur Benedikts
Admin-Bereich erwähnt es.)

## Datenmodell

Drei neue Tabellen. Die Push-Infrastruktur aus Daily Learning wird wiederverwendet.

| Tabelle | Wichtige Felder |
|---|---|
| love_notes | id, sender_id, recipient_id, text (max. 150 Zeichen), created_at, read_at, is_favorite_sender, is_favorite_recipient |
| compliments | id, text_en, created_by (system / admin), active, created_at |
| compliment_views | id, user_id, compliment_id, shown_at |

- Row Level Security: Eine Love Note ist nur für Absender und Empfänger lesbar. read_at setzt nur der Empfänger.
- compliments: für Nina nur lesbar, für die Admin-Rolle bearbeitbar.
- Senden einer Love Note: Server-Endpunkt speichert die Nachricht und verschickt sofort den Push an das Handy des Empfängers.
- Kompliment-Auswahl: zufällig aus den aktiven Komplimenten, die in der aktuellen Runde noch nicht gezeigt wurden.
- **[Umsetzung]** Love Notes: Seite `/love-notes` (Briefumschlag 💌 oben rechts auf Home, beide Konten).
  Senden als Server Action (`sendLoveNote`), Empfänger ist immer das andere Konto (`is_love_partner`).
  `love_notes` hat nur select/insert für Nutzer; `read_at` und Favoriten ändern die DB-Funktionen
  `mark_love_notes_read()` (nur Empfänger) und `toggle_love_note_favorite(id)` (jede Seite ihren eigenen).
  Beim Öffnen des Postfachs werden empfangene Notes als gelesen markiert (diesmal noch mit „neu“).
  Benedikt schaltet Pushes im Admin-Tab ein, Nina auf Home.

## Umsetzung in Phasen

- [x] **Phase E1 – Schütteln:** Bewegungserkennung mit Sperre, Blütenregen-Animation, Kompliment-Karte, 50 Start-Komplimente, Verwaltung im Admin-Bereich, Erlaubnis-Abfrage auf dem iPhone.
- [x] **Phase E2 – Love Notes:** Tabelle mit RLS, Schreiben und Postfach für beide Konten, Push an den Empfänger, ungelesen-Punkt auf Home, Favoriten.

## Offene Punkte

- [x] Ruhezeiten: keine, immer sofort zustellen.
- [ ] Wie erfährt Nina vom Schütteln: Benedikts Entscheidung, betrifft die App nicht.
- [x] Push-Text: nur „💌 Neue Love Note“, ohne Nachrichtentext.
- [x] Eigene Komplimente: später im Admin-Bereich.

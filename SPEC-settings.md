# NinAI – Einstellungen & Designs

Stand: 26.11.2026 · Autor: Benedikt

> Entscheidungen sind mit **[Entschieden]** markiert, Abweichungen bei der Umsetzung mit **[Umsetzung]**.

## Überblick

Eine eigene Seite **Einstellungen** (`/einstellungen`) für beide Konten, erreichbar über das
⚙️-Symbol oben rechts auf Home neben dem 💌. Inhalt: Benachrichtigungen, Design, Konto (Abmelden).
Jede Person sieht nur ihre eigenen Einstellungen.

## Benachrichtigungen

- Hauptschalter „Auf diesem Gerät“ (Push-Abo dieses Geräts) – ersetzt die bisherigen Karten auf Home,
  im Admin-Tab und in Remind me.
- **[Entschieden]** Darunter ein Schalter **pro Push-Art**:
  - Nina: 💌 Love Notes · 📚 Lern-Erinnerung 19:00 · ⏰ Erinnerungen (Remind me) · ☀️ Tagesüberblick 07:30
  - Benedikt: 💌 Love Notes · 🎁 Gutscheine
- Standard: alles an, nur der Tagesüberblick aus.
- Die neutrale Zeile „Bewegungssensoren für kleine Animationen“ (iPhone) steht ebenfalls hier.
- **[Umsetzung]** Spalten `push_love_notes`, `push_learning`, `push_reminders`, `push_rewards` in
  `user_settings` (Standard true), dazu das bestehende `daily_overview`. `sendPush(ids, payload, kind)`
  filtert zentral; Nutzer ohne Eintrag bekommen alles.

## Design

**[Entschieden]** Fünf Kacheln mit Farbvorschau, Wechsel wirkt sofort. Gespeichert **pro Konto**
(alle Geräte), Nina und Benedikt können verschiedene Modi haben.

| Modus | Farben | Maskottchen | Motiv (Wiese, Bewertung, Schütteln) |
|---|---|---|---|
| 🌸 Flower (Standard) | Rosa, Lavendel, Mint | Maus | Blumen, Blumenwiese, Blütenregen |
| ◻️ Clean Light | Warmweiß, Beige, Greige, Akzent Anthrazit | Origami-Kranich | Eukalyptus-Blätter; Zweig, der Blätter bekommt; Blätterregen |
| 🌙 Dark | Fast schwarz, rosa Akzent | kleine Eule | Sterne als Sternbild-Pfad; Mondphasen 1–10; Sternschnuppen |
| 🐾 Cozy Cat | Creme, Karamell, Zimtbraun, Espresso | getigerte Katze | Pfotenpfad mit Wollknäueln; Katze wacht auf 1–10; Pfotenregen |
| 🌓 Automatisch | Flower bzw. Dark je nach Hell/Dunkel-Einstellung des Handys | – | – |

- **[Entschieden]** Dark mit rosa Akzent; Name „Cozy Cat“; zusätzliche Kachel „Automatisch“.
- Technik: Jeder Modus ist ein Satz CSS-Variablen (`[data-theme=…]` auf `<html>`), gespeichert in
  `user_settings.theme` und zusätzlich als Cookie, damit beim Öffnen nichts aufblitzt.
  Motiv-Komponenten (Maskottchen, Bewertung, Pfad, Schüttel-Regen) bekommen eine Variante pro Modus.
- Grenze: Das App-Symbol auf dem Homescreen bleibt die Maus.
- Das Schütteln bleibt ein Easter Egg – auch die Motiv-Varianten werden nirgends erwähnt.

## Umsetzung in Phasen

- [x] **Phase S1 – Einstellungen:** ⚙️ auf Home, Seite mit Geräte-Schalter, Schaltern pro Push-Art,
  Bewegungssensoren und Abmelden.
- [x] **Phase S2 – Design-System:** Flower, Clean Light, Dark, Automatisch, Umschalter.
  **[Umsetzung]** Die Farben von Cozy Cat sind schon in S2 dabei; Maskottchen und Motive folgen in S3.
  Vorher wechselte die App automatisch mit dem Handy in dunkle Farben – das macht jetzt nur noch „Automatisch“.
- [ ] **Phase S3 – Motive:** Cozy Cat sowie die Motive für Clean Light und Dark.

## Offene Punkte

- [x] Motive bestätigt: Clean Light = Origami-Kranich & Eukalyptus, Dark = Eule, Mond & Sterne.

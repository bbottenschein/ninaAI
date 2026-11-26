# NinAI – Modul „Remind me“

Stand: 26.11.2026 · Autor: Benedikt

> Übernommen aus dem Konzept-Dokument. Entscheidungen zu den offenen Punkten sind mit
> **[Entschieden]** markiert, Abweichungen bei der Umsetzung mit **[Umsetzung]**.

## Überblick

„Remind me“ ist das zweite Modul in NinAI: eine To-do- und Erinnerungsliste für Nina,
getrennt in die Bereiche **Work Mode** (Job) und **Life Mode** (Privat). Aufgaben trägt sie
über ein KI-Eingabefeld ein und korrigiert sie danach bei Bedarf von Hand.

- **Module:** „Daily Learning“ (Tageslektion, Vokabeln, Knowledge, Success mit Streak,
  Blumenwiese und Gutscheinen) und „Remind me“ (Eingabe und To-Do Overview).
- **Abgrenzung:** „Remind me“ zählt nicht zur Streak und hat keine Gamification. Es soll ein
  ruhiges Werkzeug sein.

### Neue Navigation (untere Leiste)

| Tab | Inhalt |
|---|---|
| Home | Tagesstatus: Wochentag und Datum, Lektion- und Streak-Status, heute fällige To-dos |
| Daily Learning | Unter-Tabs: Lektion, Vokabeln, Knowledge, Success (Streak, Blumenwiese, Gutscheine) |
| Remind me | Sections: Eingabe und To-Do Overview, Bereiche Work Mode und Life Mode |

**[Entschieden]** Der Unter-Tab heißt „Success“ (statt „Gutscheine“), wie im bestehenden
Success-Bereich. Damit bleiben genau 3 Tabs, und Platz für weitere Module ist da.

### Home

- **Kopf:** Wochentag und Datum, z. B. „Donnerstag, 26. November“.
- **Daily Learning:** Status der Lektion (offen / 2 von 3 Schritten / erledigt) mit Button „Weiter lernen“.
- **Streak:** aktuelle Streak, Joker-Status und Tage bis zur nächsten Belohnung.
- **Heute fällig:** alle To-dos für heute plus überfällige (rot), mit Kennzeichnung Work Mode
  oder Life Mode. Direkt hier abhakbar.
- **Wochenende:** Samstag und Sonntag zeigt Home nur Aufgaben aus dem Life Mode. Unter der
  Woche, auch abends, erscheinen beide Bereiche.
- **[Umsetzung]** Der Admin (Benedikt) sieht auf Home nur Ninas Lektion und Streak, keine To-dos.

## Funktionen

„Remind me“ hat zwei Sections: **Eingabe** (KI-Feld plus Korrektur-Karte) und
**To-Do Overview**. Jede Aufgabe gehört zu einem der Bereiche Work Mode oder Life Mode.

### Bereiche: Work Mode & Life Mode

- **Work Mode:** alles rund um den Job, z. B. Meetings, Deadlines, Follow-ups.
- **Life Mode:** alles Private, z. B. Einkauf, Haushalt, Termine, Geschenke.
- **Design:** „Remind me“ übernimmt die Farbpalette aus Daily Learning (rosa, clean, blumig).
  Work Mode bekommt ein gedecktes Altrosa, Life Mode ein helles Blütenrosa. Die Farben bleiben
  überall gleich (Home, Overview, Push).

### Aufgabe

| Feld | Pflicht | Beispiel |
|---|---|---|
| Titel | ja | Geschenk für Mama besorgen |
| Bereich | ja | Life Mode |
| Liste | ja (Work Mode: immer Job; Life Mode: Standard Allgemein) | Einkauf |
| Notiz | nein | Buchhandlung am Markt |
| Fällig am (Datum, optional Uhrzeit) | nein | Fr, 28.11., 18:00 |
| Erinnerung | nein | 1 Tag vorher / zur Fälligkeit / eigene Zeit |
| Wiederholung | nein | täglich, wöchentlich, monatlich, jährlich, eigene Wochentage |
| Priorität | nein | wichtig (Stern) |

### Listen

- **Work Mode:** genau eine Liste „Job“. Keine Listenauswahl nötig, jede Work-Mode-Aufgabe landet dort.
- **Life Mode:** Startlisten Allgemein, Einkauf, Haushalt. Eigene Listen anlegen, umbenennen, löschen.
- Einkaufsliste ohne Datum: einfach abhaken, erledigte Einträge mit einem Tipp leeren.

### To-Do Overview

- **Umschalter oben:** Alle / Work Mode / Life Mode. Die letzte Auswahl bleibt gespeichert.
- **Heute:** Überfälliges rot markiert oben, jeweils mit Button „Mit KI ändern“, dann alles, was heute fällig ist.
- **Geplant:** kommende Aufgaben nach Datum gruppiert (Morgen, Diese Woche, Später).
- **Listen:** alle Listen des gewählten Bereichs mit Anzahl offener Aufgaben.
- **Erledigt:** die letzten 30 Tage, einzelne Aufgaben wiederherstellbar.
- Tipp auf eine Aufgabe öffnet dieselbe Karte wie bei der Eingabe zum Bearbeiten.

### Bedienung

- Abhaken per Tipp auf den Kreis, Wischen nach links zum Löschen, nach rechts zum Verschieben auf morgen.
- Wiederkehrende Aufgabe abgehakt: die nächste wird automatisch angelegt.
- Schwebender „+“-Button auf jeder Ansicht.

## Eingabe (KI-Assistent)

Die Eingabe-Section besteht aus einem einzigen Feld. Sie tippt oder spricht einen Satz,
Claude füllt daraus alle Felder vor. Danach erscheint die Aufgabe als bearbeitbare Karte, sie
korrigiert bei Bedarf und tippt auf „Speichern“.

| Eingabe | Ergebnis |
|---|---|
| „Zahnarzt Freitag 15 Uhr, erinner mich Donnerstag Abend“ | Neu · Life Mode · Zahnarzt · Fällig: Fr 15:00 · Erinnerung: Do 19:00 |
| „Präsentation für den Kunden bis Mittwoch fertig machen“ | Neu · Work Mode · Liste Job · Fällig: Mi · Erinnerung: Mi 09:00 |
| „Jeden Montag Müll rausbringen“ | Neu · Life Mode · Müll rausbringen · Wiederholung: wöchentlich Mo |
| „Milch, Eier und Brot“ | Neu · Life Mode · 3 Einträge in der Liste Einkauf |
| „Schieb Zahnarzt um einen Tag“ | Änderung · Zahnarzt: Fällig neu Sa 15:00, Erinnerung Fr 19:00 |
| „Alles Überfällige auf morgen“ | Änderung · alle überfälligen Aufgaben: Fällig morgen |

- **Bereich:** Claude erkennt Work Mode oder Life Mode aus dem Inhalt (Kunde, Meeting, Chef → Work Mode). Auf der Karte mit einem Tipp umschaltbar.
- **Korrektur-Karte:** Alle Felder sind direkt editierbar: Titel, Bereich, Liste, Datum, Uhrzeit, Erinnerung, Wiederholung, Priorität, Notiz. Datum und Uhrzeit per Auswahl, nicht per Tippen.
- **Mehrere Aufgaben:** Erkennt Claude mehrere Aufgaben in einem Satz, erscheint pro Aufgabe eine Karte.
- **Änderungen per KI:** Das Eingabefeld versteht auch Befehle für bestehende Aufgaben, z. B. verschieben, umbenennen, löschen oder abhaken. Claude sucht die passende Aufgabe und zeigt die geänderte Karte zur Bestätigung. Bei mehreren Treffern fragt die App, welche gemeint ist.
- **Aus der Aufgabe heraus:** Der Button „Mit KI ändern“ an einer Aufgabe (z. B. bei überfälligen) öffnet das Eingabefeld mit Bezug auf genau diese Aufgabe. Dann reicht „um einen Tag schieben“.
- **Sprache:** Mikrofon-Taste im Eingabefeld. Die Spracherkennung aus dem Tutor wird wiederverwendet. Deutsch und Englisch funktionieren.
- **Standardzeiten:** „Abend“ = 19:00, „Morgen früh“ = 08:00, ohne Uhrzeit = ganztägig mit Erinnerung um 09:00.
- **Kontext:** Claude bekommt das heutige Datum, die Zeitzone Europe/Berlin und die offenen Aufgaben (Titel, Datum) mit, damit „nächsten Freitag“ und „Zahnarzt“ richtig aufgelöst werden.
- **Fallback:** Klappt die KI nicht (z. B. keine Verbindung), öffnet sich die leere Karte mit dem eingegebenen Text als Titel.
- **[Umsetzung]** Claude liefert Operationen (anlegen / ändern / löschen / abhaken) als striktes JSON
  (`src/features/remind/ai-schema.ts`). Eine getestete Prüfung (`ai-normalize.ts`) gleicht sie mit den
  echten Listen und Aufgaben ab und verwirft Ungültiges. Bei Änderungen liefert Claude den vollständigen
  neuen Stand; mehrere Treffer → „Welche Aufgabe meinst du?“. Ohne ausdrückliche Erinnerung bekommt eine
  Aufgabe mit Datum „zur Fälligkeit“ (ganztägig 09:00), ohne Datum keine. Die Spracheingabe nutzt das
  Tageslimit des Tutors (5 Minuten Aufnahme).

## Benachrichtigungen

Erinnerungen kommen als Web-Push auf ihr Handy, über dieselbe Infrastruktur wie der Lern-Reminder.

- **Erinnerung:** Push mit Titel der Aufgabe zum eingestellten Zeitpunkt. Ein Tipp öffnet die Aufgabe mit den Buttons „Erledigt“ und „Später“ (in 1 Stunde, heute Abend, morgen).
- **Wochenende:** **[Entschieden]** Erinnerungen aus dem Work Mode, die auf Samstag oder Sonntag fallen, werden auf Montag 08:00 verschoben. Abends unter der Woche kommen sie normal.
- **Tagesüberblick (optional):** Um 07:30 ein Push wie „Heute: 3 Aufgaben, 1 überfällig“. Am Wochenende zählt er nur Life-Mode-Aufgaben. In den Einstellungen abschaltbar. **[Entschieden]** Standardmäßig **aus**.
- **Zusammenlegen:** Fallen mehrere Erinnerungen in dieselbe Minute, kommt ein gemeinsamer Push.

### Grenzen, die man kennen sollte

- Auf dem iPhone kommen Pushes nur, wenn NinAI zum Homescreen hinzugefügt und die Mitteilungen erlaubt sind.
- Web-Push kann sich um bis zu ein, zwei Minuten verzögern. Ein Wecker oder ein Alarm, der den Stumm-Modus durchbricht, ist so nicht möglich.
- Für kritische Termine (z. B. Medikamente, Flug) bleibt die eingebaute Erinnerungs-App des Handys die zuverlässigere Wahl. Das sollte sie wissen.

## Privatsphäre & gemeinsame Liste

Ihre Aufgaben sind privat. Der Admin-Zugang von Benedikt sieht „Remind me“ nicht.

- Row Level Security: Aufgaben und Listen sind nur für ihr eigenes Konto lesbar und schreibbar. Die Admin-Rolle bekommt hier ausdrücklich keinen Lesezugriff.
- Der Home-Tab im Admin-Bereich zeigt weiterhin nur Streak und Gutscheine.

### Optional: gemeinsame Liste (spätere Phase)

- Sie kann eine einzelne Liste (z. B. Einkauf oder Wochenende) für Benedikt freigeben. Nur diese Liste ist dann für beide sichtbar und bearbeitbar.
- Neue Einträge von ihm sind mit einem kleinen Hinweis markiert („von Benedikt“). Sie bekommt dazu keinen Push, außer er setzt eine Erinnerung.
- Die Freigabe kann sie jederzeit beenden.
- **[Offen]** Erst mit Nina absprechen, bevor Phase R4 diesen Teil umsetzt.

## Datenmodell & Jobs

Zwei neue Tabellen und ein Job, der jede Minute fällige Erinnerungen verschickt.
Das verbindliche Schema steht in `supabase/migrations/`.

| Tabelle | Wichtige Felder |
|---|---|
| todo_lists | id, owner_id, area (work / life), name, color, sort_order, shared_with (user_id, optional), created_at |
| todos | id, list_id, owner_id, title, note, due_date, due_time, remind_at, repeat_rule (RRULE, z. B. FREQ=WEEKLY;BYDAY=MO), priority, completed_at, reminder_sent_at, snoozed_until, created_by, created_via (form / ai_text / ai_voice) |

### Jobs (Europe/Berlin)

1. **Jede Minute – Erinnerungs-Job:** Aufgaben mit remind_at bzw. snoozed_until ≤ jetzt und reminder_sent_at leer suchen, Push senden, reminder_sent_at setzen.
2. **07:30 – Tagesüberblick:** Anzahl der heutigen und überfälligen Aufgaben zählen, Push senden (falls aktiviert).

### Logik

- Wiederholung: Beim Abhaken einer Aufgabe mit repeat_rule wird die nächste Instanz mit neuem Fälligkeitsdatum und neuer Erinnerung angelegt.
- „Später“ setzt snoozed_until und leert reminder_sent_at, damit der Job erneut erinnert.
- **[Umsetzung]** Monatlich am 31. → letzter Tag des kürzeren Monats; jährlich am 29.02. → 28.02.
  Lag eine wiederkehrende Aufgabe lange zurück, beginnt die nächste Instanz frühestens heute.
- **[Umsetzung]** Erinnerungen, die beim Job-Lauf älter als 6 Stunden sind (z. B. nachträglich
  für gestern angelegt), werden ohne Push als erledigt markiert.
- KI-Schnelleingabe: eigener Server-Endpunkt, der Text an Claude schickt und striktes JSON mit den Feldern oben zurückbekommt. Ungültiges JSON führt zum Formular-Fallback.

## Umsetzung in Phasen

Vier Phasen. Nach Phase 2 ist „Remind me“ im Alltag voll nutzbar.

- [x] **Phase R1 – Grundgerüst:** neue Navigation (Home, Daily Learning mit Success-Unter-Tab, Remind me), Tabellen mit RLS, Bereiche Work Mode und Life Mode, Korrektur-Karte zum manuellen Anlegen und Bearbeiten, To-Do Overview mit Umschalter und Ansichten Heute / Geplant / Listen / Erledigt.
- [x] **Phase R2 – Home & Erinnerungen:** Home mit Tagesstatus (Datum, Lektion, Streak, heute fällige To-dos), Erinnerungs-Job, Push mit „Erledigt“ und „Später“, Wiederholungen, Wochenend-Regel für den Work Mode.
- [x] **Phase R3 – KI-Eingabe:** KI-Eingabefeld, das die Karte vorbefüllt, mit Bereichserkennung, Spracheingabe, Standardzeiten, mehreren Aufgaben pro Satz und Änderungen per KI (inkl. Button „Mit KI ändern“).
- [x] **Phase R4 – Extras:** Tagesüberblick um 07:30 (Schalter in Remind me, Tabelle `user_settings`).
- [ ] **Später:** gemeinsame Liste mit Benedikt – erst nach Absprache mit Nina.

## Offene Punkte

- [x] Work-Mode-Erinnerungen am Wochenende: auf Montag 08:00 verschieben.
- [x] Tagesüberblick um 07:30: standardmäßig aus.
- [ ] Gemeinsame Liste mit Benedikt: gewünscht? Erst mit Nina absprechen.

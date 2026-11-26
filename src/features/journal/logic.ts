import { addDays, berlinParts, berlinToUtc } from "@/lib/date";

export const MOOD_WORDS = ["happy", "calm", "grateful", "tired", "stressed", "sad", "excited"] as const;
export type MoodWord = (typeof MOOD_WORDS)[number];

export const MOOD_EMOJI: Record<MoodWord, string> = {
  happy: "😊",
  calm: "😌",
  grateful: "🙏",
  tired: "😴",
  stressed: "😵‍💫",
  sad: "😢",
  excited: "🤩",
};

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const RATING_LABELS = { min: "Tough day", max: "Amazing day" };

/** Die vier Fragen mit Satzanfängen für den Hilfe-Button (SPEC-journal › Fragen). */
export const QUESTIONS = {
  day_text: {
    label: "How was your day?",
    starters: ["Today I …", "This morning I …", "In the afternoon …", "It was a … day because …"],
  },
  gratitude: {
    label: "What are you grateful for today?",
    starters: ["I'm grateful for … because …", "I'm thankful that …", "I really appreciated …"],
  },
  highlight: {
    label: "What was the highlight of your day?",
    starters: ["The best moment was …", "I really enjoyed …"],
  },
  tomorrow_focus: {
    label: "What do you want to focus on tomorrow?",
    starters: ["Tomorrow I want to …", "I'd like to focus on …"],
  },
} as const;

export type JournalEntry = {
  id: string;
  date: string;
  rating: number;
  mood_word: MoodWord | null;
  day_text: string;
  gratitude: string[];
  highlight: string;
  tomorrow_focus: string;
  feedback: unknown | null;
  created_at: string;
  updated_at: string;
};

/** Hinweis auf Home erscheint ab 18:00 (SPEC-journal › Kein Druck). */
export const HOME_CARD_FROM = "18:00";
/** Ein Tag bleibt bis 12:00 am Folgetag bearbeitbar ([Entschieden] Zeitfenster). */
export const EDIT_UNTIL = "12:00";

/** Bis wann der Eintrag eines Tages angelegt und bearbeitet werden kann. */
export function editableUntil(date: string): Date {
  return berlinToUtc(addDays(date, 1), EDIT_UNTIL);
}

export function isEditable(date: string, now: Date): boolean {
  const today = berlinParts(now).date;
  return date <= today && now.getTime() < editableUntil(date).getTime();
}

/** Tage, für die sie jetzt schreiben kann: heute, und gestern noch bis 12:00. */
export function writableDates(now: Date): string[] {
  const today = berlinParts(now).date;
  const yesterday = addDays(today, -1);
  return isEditable(yesterday, now) ? [today, yesterday] : [today];
}

/** Ruhige Karte auf Home: ab 18:00, oder wenn es schon einen Eintrag gibt. */
export function showHomeCard(now: Date, hasEntry: boolean): boolean {
  return hasEntry || berlinParts(now).time >= HOME_CARD_FROM;
}

export type EntryInput = {
  rating: number;
  mood_word: string | null;
  day_text: string;
  gratitude: string[];
  highlight: string;
  tomorrow_focus: string;
};

export type CleanEntry = Omit<EntryInput, "mood_word"> & { mood_word: MoodWord | null };

/** Prüft und säubert einen Eintrag. Kurze Einträge sind ausdrücklich okay. */
export function validateEntry(input: EntryInput): { entry: CleanEntry } | { error: string } {
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return { error: "Bitte bewerte deinen Tag (1–10)." };
  }
  const day_text = input.day_text.trim();
  if (!day_text) return { error: "Schreib ein paar Worte zu „How was your day?“." };
  const gratitude = input.gratitude.map((g) => g.trim()).filter(Boolean).slice(0, 3);
  if (gratitude.length === 0) return { error: "Schreib mindestens eine Sache, für die du dankbar bist." };
  if (day_text.length > 5000 || gratitude.some((g) => g.length > 300)) return { error: "Der Text ist zu lang." };
  const highlight = input.highlight.trim().slice(0, 1000);
  const tomorrow_focus = input.tomorrow_focus.trim().slice(0, 1000);
  const mood_word = (MOOD_WORDS as readonly string[]).includes(input.mood_word ?? "")
    ? (input.mood_word as MoodWord)
    : null;
  return { entry: { rating, mood_word, day_text, gratitude, highlight, tomorrow_focus } };
}

/** Wie weit die Blume geöffnet ist (0 = Knospe … 1 = voll erblüht). */
export function bloom(rating: number): number {
  const r = Math.min(RATING_MAX, Math.max(RATING_MIN, rating));
  return (r - RATING_MIN) / (RATING_MAX - RATING_MIN);
}

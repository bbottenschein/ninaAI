"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import type { TutorQuestion } from "@/features/lesson/schema";
import { Mouse } from "@/features/shell/mouse";
import { tutorTurn } from "./actions";
import { MAX_RECORDING_SECONDS, VOICE_LIMIT_SECONDS, openingMessage, type ChatMessage } from "./logic";
import type { TutorFeedback } from "./prompts";
import type { StoredTutorResult } from "./queries";
import { recorderSupported, useRecorder, type Recording } from "./use-recorder";
import { speechSupported, useSpeech } from "./use-speech";

type Phase = "intro" | "chat" | "feedback";

const noop = () => () => {};
/** true erst im Browser – Server und erster Client-Render bleiben gleich. */
function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function TutorChat({
  date,
  name,
  questions,
  initialResult,
  voiceSecondsUsed,
  readOnly,
}: {
  date: string;
  name: string;
  questions: TutorQuestion[];
  initialResult: StoredTutorResult | null;
  voiceSecondsUsed: number;
  readOnly: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(initialResult ? "feedback" : "intro");
  const [messages, setMessages] = useState<ChatMessage[]>(initialResult?.transcript ?? []);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(initialResult?.feedback ?? null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceLeft, setVoiceLeft] = useState(VOICE_LIMIT_SECONDS - voiceSecondsUsed);
  const [micOk, setMicOk] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [pending, startTransition] = useTransition();
  const { speak, stop: stopSpeaking, speaking } = useSpeech();
  const recorder = useRecorder(handleRecording);
  const endRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const canSpeak = isClient && speechSupported();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, transcribing]);

  function say(text: string) {
    if (voiceOn) speak(text);
  }

  function start() {
    const opening = openingMessage(name, questions);
    setMessages([opening]);
    setFeedback(null);
    setError(null);
    setPhase("chat");
    // Erstes Vorlesen direkt im Tipp – iPhones erlauben Ton nur nach einer Berührung.
    say(opening.text);
  }

  async function handleRecording({ blob, seconds }: Recording) {
    if (seconds < 0.8) {
      setNotice("Die Aufnahme war zu kurz – halte den Knopf etwas länger gedrückt oder tippe nochmal.");
      return;
    }
    setTranscribing(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("audio", blob);
      form.append("seconds", String(seconds));
      const res = await fetch("/api/tutor/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (res.ok && data.text) {
        setDraft((d) => (d ? `${d} ${data.text}` : data.text!));
        setVoiceLeft((left) => left - Math.ceil(seconds));
      } else if (data.error === "limit") {
        setVoiceLeft(0);
        setNotice("Dein Sprach-Limit für heute ist aufgebraucht. Tippe deine Antwort einfach ein.");
      } else if (res.ok) {
        setNotice("Ich habe nichts verstanden. Versuch es nochmal oder tippe deine Antwort.");
      } else {
        setMicOk(false);
        setNotice("Die Spracherkennung ist gerade nicht erreichbar. Tippe deine Antwort einfach ein.");
      }
    } catch {
      setNotice("Keine Verbindung. Versuch es nochmal oder tippe deine Antwort.");
    } finally {
      setTranscribing(false);
    }
  }

  async function toggleRecording() {
    setError(null);
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    stopSpeaking();
    try {
      await recorder.start();
    } catch {
      setMicOk(false);
      setNotice("Ohne Mikrofon-Zugriff geht es per Tippen weiter.");
    }
  }

  function send() {
    const text = draft.trim();
    if (!text || pending) return;
    stopSpeaking();
    const history: ChatMessage[] = [...messages, { role: "nina", text }];
    setMessages(history);
    setDraft("");
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await tutorTurn(date, history);
      if ("error" in result) {
        setError(result.error);
        setMessages(messages); // Antwort zurück ins Eingabefeld
        setDraft(text);
        return;
      }
      setMessages([...history, result.message]);
      say(result.message.text);
      if (result.kind === "done") {
        setFeedback(result.feedback);
        setPhase("feedback");
      }
    });
  }

  const header = (
    <header className="mb-4 flex items-center justify-between gap-4">
      <div>
        <Link href="/learn" className="text-sm font-bold text-accent-ink">
          ← Lektion
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Tutor-Gespräch</h1>
      </div>
      {phase === "chat" && canSpeak && (
        <button
          type="button"
          onClick={() => {
            if (voiceOn) stopSpeaking();
            setVoiceOn(!voiceOn);
          }}
          aria-pressed={voiceOn}
          className="rounded-full border-2 border-border bg-surface px-3 py-1.5 text-sm font-bold"
        >
          {voiceOn ? "🔊 An" : "🔇 Aus"}
        </button>
      )}
    </header>
  );

  if (readOnly) {
    return (
      <>
        {header}
        {initialResult ? (
          <>
            <Transcript messages={initialResult.transcript} />
            <FeedbackCard feedback={initialResult.feedback} />
          </>
        ) : (
          <p className="card text-muted">Nina hat heute noch kein Gespräch geführt.</p>
        )}
      </>
    );
  }

  if (phase === "intro") {
    return (
      <>
        {header}
        <div className="card animate-pop text-center">
          <Mouse className="mx-auto size-24 animate-float" />
          <p className="mt-3 text-lg font-extrabold">Bereit für ein kleines Gespräch?</p>
          <p className="mt-1 text-sm text-muted">
            Der Tutor stellt dir {questions.length} Fragen zu den News – auf Englisch, ganz entspannt.
            Antworte per Mikrofon oder tippe. Fehler sind völlig okay!
          </p>
          <button type="button" onClick={start} className="btn-primary mt-5 w-full">
            Gespräch starten 🎙️
          </button>
        </div>
      </>
    );
  }

  const busy = pending || transcribing;
  const canRecord = isClient && micOk && voiceLeft > 1 && recorderSupported();

  return (
    <>
      {header}
      <Transcript messages={messages} onReplay={canSpeak ? speak : undefined} speaking={speaking} />

      {pending && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
          <Mouse mood="sleepy" className="size-8 animate-wiggle" /> Der Tutor denkt nach …
        </div>
      )}

      {phase === "feedback" && feedback ? (
        <>
          <FeedbackCard feedback={feedback} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={start} className="btn-secondary">
              Nochmal 🔁
            </button>
            <Link href="/learn" className="btn-primary text-center">
              Fertig ›
            </Link>
          </div>
          <p className="mt-2 text-center text-xs text-muted">„Nochmal“ ändert nichts an deiner Streak.</p>
        </>
      ) : (
        <div className="sticky bottom-28 mt-5 rounded-3xl border border-border bg-surface p-3 shadow-soft">
          {transcribing && <p className="px-2 pb-2 text-sm text-muted">Ich höre zu … ✍️</p>}
          {recorder.recording && (
            <p className="px-2 pb-2 text-sm font-bold text-accent-ink">
              ● Aufnahme {recorder.seconds}s / {MAX_RECORDING_SECONDS}s – tippe zum Beenden
            </p>
          )}
          <div className="flex items-end gap-2">
            {canRecord && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={busy}
                aria-label={recorder.recording ? "Aufnahme beenden" : "Antwort aufnehmen"}
                className={`flex size-12 shrink-0 items-center justify-center rounded-full text-xl transition active:scale-90 disabled:opacity-50 ${
                  recorder.recording ? "animate-pulse bg-accent text-on-accent" : "bg-accent-soft"
                }`}
              >
                {recorder.recording ? "■" : "🎙️"}
              </button>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={canRecord ? "Sprechen oder tippen …" : "Deine Antwort auf Englisch …"}
              rows={draft.length > 60 ? 3 : 1}
              lang="en"
              className="input min-h-12 flex-1 resize-none py-2.5"
              disabled={pending || recorder.recording}
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || busy || recorder.recording}
              aria-label="Senden"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-on-accent transition active:scale-90 disabled:opacity-40"
            >
              ↑
            </button>
          </div>
          {notice && <p className="px-2 pt-2 text-sm text-muted">{notice}</p>}
          {error && (
            <p role="alert" className="px-2 pt-2 text-sm text-danger">
              {error}
            </p>
          )}
          {canRecord && voiceLeft < 90 && (
            <p className="px-2 pt-2 text-xs text-muted">Noch {Math.max(0, Math.floor(voiceLeft))} s Sprache für heute.</p>
          )}
        </div>
      )}
      <div ref={endRef} />
    </>
  );
}

function Transcript({
  messages,
  onReplay,
  speaking,
}: {
  messages: ChatMessage[];
  onReplay?: (text: string) => void;
  speaking?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((m, i) =>
        m.role === "tutor" ? (
          <li key={i} className="flex animate-pop items-end gap-2">
            <Mouse className="size-9 shrink-0" />
            <button
              type="button"
              lang="en"
              disabled={!onReplay}
              onClick={() => onReplay?.(m.text)}
              className="rounded-3xl rounded-bl-md border border-border bg-surface px-4 py-3 text-left shadow-soft"
            >
              {m.text}
              {onReplay && (
                <span className="ml-1.5 text-xs text-muted" aria-label="Nochmal vorlesen">
                  {speaking && i === messages.length - 1 ? "🔊" : "↻"}
                </span>
              )}
            </button>
          </li>
        ) : (
          <li key={i} lang="en" className="ml-10 animate-pop self-end rounded-3xl rounded-br-md bg-accent px-4 py-3 font-semibold text-on-accent">
            {m.text}
          </li>
        ),
      )}
    </ol>
  );
}

function FeedbackCard({ feedback }: { feedback: TutorFeedback }) {
  return (
    <section className="card mt-6 animate-pop">
      <div className="flex items-center gap-3">
        <Mouse mood="party" className="size-14 shrink-0" />
        <h2 className="text-xl font-extrabold">Dein Feedback</h2>
      </div>

      <p className="mt-4 text-sm font-extrabold text-mint">Das war richtig gut</p>
      <ul className="mt-2 flex flex-col gap-2">
        {feedback.strengths.map((s, i) => (
          <li key={i} className="rounded-2xl bg-mint-soft px-4 py-3">
            <p className="font-semibold">✨ {s.text_de}</p>
            {s.quote && (
              <p lang="en" className="mt-1 text-sm text-muted italic">
                „{s.quote}“
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-sm font-extrabold text-lavender">Dein Tipp</p>
      <div className="mt-2 rounded-2xl bg-lavender-soft px-4 py-3">
        <p className="font-semibold">💡 {feedback.tip.text_de}</p>
        <p lang="en" className="mt-2 text-sm text-muted line-through decoration-accent/60">
          {feedback.tip.original}
        </p>
        <p lang="en" className="mt-1 font-bold">
          → {feedback.tip.corrected}
        </p>
      </div>
    </section>
  );
}

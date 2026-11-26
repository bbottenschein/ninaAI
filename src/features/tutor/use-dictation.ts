"use client";

import { useState, useSyncExternalStore } from "react";
import { recorderSupported, useRecorder, type Recording } from "./use-recorder";

const noop = () => () => {};

/**
 * Diktieren per Mikrofon: Aufnahme im Browser, Erkennung über /api/tutor/transcribe
 * (gleiche Spracherkennung und gleiches Tageslimit wie beim Tutor).
 */
export function useDictation(onText: (text: string) => void) {
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const recorder = useRecorder(handle);

  async function handle({ blob, seconds }: Recording) {
    if (seconds < 0.8) return;
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob);
      form.append("seconds", String(seconds));
      const res = await fetch("/api/tutor/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string; detail?: string };
      if (res.ok && data.text) onText(data.text);
      else if (data.error === "limit") setError("Dein Sprach-Limit für heute ist aufgebraucht – tipp einfach.");
      else if (res.ok) setError("Ich habe nichts verstanden. Versuch es nochmal oder tippe.");
      else setError(`Die Spracherkennung ist gerade nicht erreichbar.${data.detail ? ` (Grund: ${data.detail})` : ""}`);
    } catch {
      setError("Keine Verbindung – tipp einfach.");
    } finally {
      setTranscribing(false);
    }
  }

  async function toggle() {
    setError(null);
    if (recorder.recording) return recorder.stop();
    try {
      await recorder.start();
    } catch {
      setError("Ohne Mikrofon-Zugriff geht es per Tippen weiter.");
    }
  }

  return {
    supported: isClient && recorderSupported(),
    recording: recorder.recording,
    seconds: recorder.seconds,
    transcribing,
    error,
    toggle,
  };
}

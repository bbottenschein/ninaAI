"use client";

import { useCallback, useEffect, useState } from "react";

// Bevorzugte amerikanische Frauenstimmen (iOS/macOS, Android/Chrome, Windows/Edge).
const PREFERRED_VOICES = [
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Zoe",
  "Nicky",
  "Google US English",
  "Microsoft Jenny",
  "Microsoft Aria",
  "Microsoft Ava",
  "Microsoft Zira",
];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").startsWith("en-US"));
  for (const name of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return voices[0] ?? null;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Vorlesen mit der Stimme des Geräts (kostenlos, keine Daten verlassen das Handy). */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  // Manche Browser laden die Stimmen erst nach dem ersten Abruf.
  useEffect(() => {
    if (speechSupported()) window.speechSynthesis.getVoices();
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = "en-US";
    utterance.rate = 0.92; // etwas langsamer für B1
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (speechSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}

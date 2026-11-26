"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "./logic";

export type Recording = { blob: Blob; seconds: number };

// Safari (iPhone) nimmt mp4 auf, Chrome/Firefox webm.
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

export function recorderSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/** Sprachaufnahme im Browser (MediaRecorder), höchstens MAX_RECORDING_SECONDS. */
export function useRecorder(onComplete: (recording: Recording) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
      const duration = Math.min((Date.now() - startedAt) / 1000, MAX_RECORDING_SECONDS);
      onCompleteRef.current({ blob: new Blob(chunks, { type: recorder.mimeType }), seconds: duration });
    };

    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setRecording(true);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) recorder.stop();
    }, 250);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    },
    [],
  );

  return { start, stop, recording, seconds };
}

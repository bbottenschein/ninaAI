"use client";

import { useEffect, useState, useTransition } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "./actions";

type Status = "loading" | "unsupported" | "install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function currentStatus(): Promise<Status> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIos() && !isStandalone() ? "install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.ready;
  return (await registration.pushManager.getSubscription()) ? "on" : "off";
}

/** Benachrichtigungen auf diesem Gerät ein- und ausschalten. */
export function PushSettings({
  publicKey,
  title,
  description,
  compact = false,
}: {
  publicKey: string | null;
  title: string;
  description: string;
  /** Ohne Abstand nach oben (z. B. in den Einstellungen). */
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    // Ohne Service Worker (z. B. im Entwicklungsmodus) wartet `ready` ewig.
    const timeout = setTimeout(() => active && setStatus((s) => (s === "loading" ? "unsupported" : s)), 4000);
    currentStatus()
      .then((s) => active && setStatus(s))
      .catch(() => active && setStatus("unsupported"));
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  if (!publicKey || status === "loading") return null;

  function enable() {
    setMessage(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!),
        });
        const result = await savePushSubscription(subscription.toJSON());
        if (result.error) {
          setMessage(result.error);
          return;
        }
        setStatus("on");
        const test = await sendTestPush();
        setMessage(test.sent > 0 ? "Eingeschaltet – eine Test-Benachrichtigung ist unterwegs." : "Eingeschaltet.");
      } catch {
        setMessage("Hat nicht geklappt. Bitte nochmal versuchen.");
      }
    });
  }

  function disable() {
    setMessage(null);
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    });
  }

  return (
    <section className={`card flex flex-col gap-2 ${compact ? "mt-3" : "mt-6"}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {status === "on" ? "🔔" : "🔕"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{title}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {status === "on" && (
          <button type="button" disabled={pending} onClick={disable} className="btn-secondary px-3 py-1.5 text-sm">
            Aus
          </button>
        )}
        {status === "off" && (
          <button type="button" disabled={pending} onClick={enable} className="btn-primary px-3 py-1.5 text-sm">
            Einschalten
          </button>
        )}
      </div>
      {status === "install" && (
        <p className="rounded-2xl bg-sun-soft px-3 py-2 text-sm">
          Auf dem iPhone gehen Benachrichtigungen nur, wenn NinAI auf dem Home-Bildschirm liegt: in Safari auf
          <strong> Teilen → Zum Home-Bildschirm</strong>, dann von dort öffnen.
        </p>
      )}
      {status === "denied" && (
        <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm">
          Benachrichtigungen sind für NinAI blockiert. Du kannst sie in den Einstellungen des Handys wieder erlauben.
        </p>
      )}
      {status === "unsupported" && (
        <p className="text-sm text-muted">Dieser Browser unterstützt keine Benachrichtigungen.</p>
      )}
      {message && <p className="text-sm text-muted">{message}</p>}
    </section>
  );
}

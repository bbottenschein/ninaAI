"use client";

import { useState } from "react";
import { PIN_LENGTH } from "./pin";

/** Ziffernfeld für die 4-stellige Journal-PIN. Ruft onComplete, sobald 4 Ziffern da sind. */
export function PinPad({
  onComplete,
  disabled,
  error,
}: {
  onComplete: (pin: string) => void | Promise<void>;
  disabled?: boolean;
  error?: string | null;
}) {
  const [pin, setPin] = useState("");

  function press(digit: string) {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      Promise.resolve(onComplete(next)).finally(() => setPin(""));
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" aria-label={`${pin.length} von ${PIN_LENGTH} Ziffern`} role="status">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`size-4 rounded-full border-2 border-accent transition ${i < pin.length ? "bg-accent" : ""}`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-label={key === "⌫" ? "Löschen" : key}
              onClick={() => (key === "⌫" ? setPin(pin.slice(0, -1)) : press(key))}
              className="size-16 rounded-full bg-surface text-2xl font-extrabold shadow-sm transition active:scale-90 disabled:opacity-40"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

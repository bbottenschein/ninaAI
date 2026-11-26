/** Bewegungssensoren im Browser (iPhone braucht eine einmalige Erlaubnis nach einem Tipp). */
export const MOTION_KEY = "ninaai.motion";
export const MOTION_EVENT = "ninaai:motion";

type MotionWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export function motionSupported(): boolean {
  return typeof window !== "undefined" && "DeviceMotionEvent" in window;
}

/** Nur iOS fragt nach – dort gibt es `DeviceMotionEvent.requestPermission`. */
export function needsMotionPermission(): boolean {
  return motionSupported() && typeof (DeviceMotionEvent as MotionWithPermission).requestPermission === "function";
}

export function storedMotion(): "granted" | "denied" | "later" | null {
  try {
    const v = localStorage.getItem(MOTION_KEY);
    return v === "granted" || v === "denied" || v === "later" ? v : null;
  } catch {
    return null;
  }
}

export function storeMotion(value: "granted" | "denied" | "later") {
  try {
    localStorage.setItem(MOTION_KEY, value);
  } catch {}
  window.dispatchEvent(new Event(MOTION_EVENT));
}

/** Muss direkt aus einem Tipp aufgerufen werden. */
export async function requestMotion(): Promise<boolean> {
  const api = DeviceMotionEvent as MotionWithPermission;
  if (typeof api.requestPermission !== "function") return true;
  try {
    return (await api.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

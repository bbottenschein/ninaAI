// NinAI Service Worker.
// Phase 1: nur Registrierung (Voraussetzung für Installation und später Web Push).
// Phase 6: Push-Benachrichtigungen ("push"/"notificationclick").
// Bewusst kein Offline-Cache: Lektion und Fortschritt kommen immer frisch vom Server.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

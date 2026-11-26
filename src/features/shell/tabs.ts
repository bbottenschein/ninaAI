import type { Role } from "@/features/auth/session";

export type Tab = {
  href: string;
  label: string;
  icon: "today" | "vocab" | "knowledge" | "rewards" | "admin";
  /** Weitere Pfade, unter denen der Tab aktiv ist (z. B. Schritte des Tages). */
  sections?: string[];
};

// Die Schritte des Tages liegen unter eigenen Pfaden, gehören aber zu „Heute“.
const TODAY: Tab = { href: "/", label: "Heute", icon: "today", sections: ["/news", "/quiz", "/tutor"] };

// Jedes Feature-Modul bringt seinen eigenen Tab mit. Neue Module hier eintragen.
const PLAYER_TABS: Tab[] = [
  TODAY,
  { href: "/vokabeln", label: "Vokabeln", icon: "vocab" },
  { href: "/knowledge", label: "Knowledge", icon: "knowledge" },
  { href: "/gutscheine", label: "Gutscheine", icon: "rewards" },
];

const ADMIN_TABS: Tab[] = [
  TODAY,
  { href: "/admin", label: "Admin", icon: "admin" },
];

export function tabsFor(role: Role): Tab[] {
  return role === "admin" ? ADMIN_TABS : PLAYER_TABS;
}

const within = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export function isActive(tab: Tab, pathname: string): boolean {
  if (tab.sections?.some((section) => within(pathname, section))) return true;
  return tab.href === "/" ? pathname === "/" : within(pathname, tab.href);
}

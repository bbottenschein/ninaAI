import type { Role } from "@/features/auth/session";

export type Tab = {
  href: string;
  label: string;
  icon: "home" | "learn" | "remind" | "journal" | "admin";
  /** Weitere Pfade, unter denen der Tab aktiv ist (z. B. Unter-Tabs und Schritte). */
  sections?: string[];
};

const HOME: Tab = { href: "/", label: "Home", icon: "home" };

// Modul „Daily Learning“: Lektion (mit News, Quiz, Tutor), Vokabeln, Knowledge, Success.
const LEARN: Tab = {
  href: "/learn",
  label: "Daily Learning",
  icon: "learn",
  sections: ["/news", "/quiz", "/tutor", "/vokabeln", "/knowledge", "/success"],
};

// Modul „Remind me“ (siehe SPEC-remind-me.md). Neue Module hier eintragen.
const REMIND: Tab = { href: "/remind", label: "Remind me", icon: "remind" };

// Modul „Journal“ (siehe SPEC-journal.md): privat, ohne Streak und ohne Pushes.
const JOURNAL: Tab = { href: "/journal", label: "Journal", icon: "journal" };

const PLAYER_TABS: Tab[] = [HOME, LEARN, REMIND, JOURNAL];

// Der Admin sieht „Remind me“ und „Journal“ nicht (privat), aber Ninas Lektion über Home.
const ADMIN_TABS: Tab[] = [HOME, { href: "/admin", label: "Admin", icon: "admin" }];

export function tabsFor(role: Role): Tab[] {
  return role === "admin" ? ADMIN_TABS : PLAYER_TABS;
}

const within = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export function isActive(tab: Tab, pathname: string): boolean {
  if (tab.sections?.some((section) => within(pathname, section))) return true;
  return tab.href === "/" ? pathname === "/" : within(pathname, tab.href);
}

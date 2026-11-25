import type { Role } from "@/features/auth/session";

export type Tab = {
  href: string;
  label: string;
  icon: "today" | "vocab" | "knowledge" | "rewards" | "admin";
};

// Jedes Feature-Modul bringt seinen eigenen Tab mit. Neue Module hier eintragen.
const PLAYER_TABS: Tab[] = [
  { href: "/", label: "Heute", icon: "today" },
  { href: "/vokabeln", label: "Vokabeln", icon: "vocab" },
  { href: "/knowledge", label: "Knowledge", icon: "knowledge" },
  { href: "/gutscheine", label: "Gutscheine", icon: "rewards" },
];

const ADMIN_TABS: Tab[] = [
  { href: "/", label: "Heute", icon: "today" },
  { href: "/admin", label: "Admin", icon: "admin" },
];

export function tabsFor(role: Role): Tab[] {
  return role === "admin" ? ADMIN_TABS : PLAYER_TABS;
}

export function isActive(tab: Tab, pathname: string): boolean {
  return tab.href === "/"
    ? pathname === "/"
    : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LEARN_TABS = [
  { href: "/learn", label: "Lektion" },
  { href: "/vokabeln", label: "Vokabeln" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/success", label: "Success" },
];

/** Unter-Tabs im Modul Daily Learning. */
export function LearnTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Daily Learning" className="-mx-5 mb-5 overflow-x-auto px-5">
      <ul className="flex gap-2">
        {LEARN_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-4 py-1.5 text-sm font-extrabold whitespace-nowrap transition ${
                  active ? "bg-accent text-on-accent" : "border-2 border-border bg-surface text-muted"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

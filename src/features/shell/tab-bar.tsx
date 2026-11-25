"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type Tab } from "./tabs";
import { TabIcon } from "./tab-icon";

export function TabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <ul className="mx-auto flex max-w-lg gap-1 rounded-full border border-border bg-surface/95 p-1.5 shadow-soft backdrop-blur">
        {tabs.map((tab) => {
          const active = isActive(tab, pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full py-2 text-[0.7rem] font-bold transition-colors ${
                  active ? "bg-accent-soft text-accent-ink" : "text-muted"
                }`}
              >
                <TabIcon icon={tab.icon} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

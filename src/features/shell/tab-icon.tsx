import type { Tab } from "./tabs";

const PATHS: Record<Tab["icon"], string> = {
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z",
  // Sprössling: Daily Learning wächst jeden Tag (passt zur Blumenwiese).
  learn: "M12 21v-8M12 13c0-4-3-6.5-7.5-6.5 0 4.2 3 6.5 7.5 6.5zM12 13c0-4 3-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5z",
  remind: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  admin: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
};

export function TabIcon({ icon }: { icon: Tab["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden
    >
      <path d={PATHS[icon]} />
    </svg>
  );
}

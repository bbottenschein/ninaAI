import type { Tab } from "./tabs";

const PATHS: Record<Tab["icon"], string> = {
  today: "M4 7h16M4 12h16M4 17h10",
  vocab: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM9 20a4 4 0 0 1-4-4",
  knowledge:
    "M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3zM9.5 21h5",
  rewards:
    "M4 10h16v10H4zM3 6h18v4H3zM12 6v14M12 6c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1",
  admin:
    "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
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

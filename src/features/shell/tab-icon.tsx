import type { Tab } from "./tabs";

const PATHS: Record<Tab["icon"], string> = {
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z",
  // Sprössling: Daily Learning wächst jeden Tag (passt zur Blumenwiese).
  learn: "M12 21v-8M12 13c0-4-3-6.5-7.5-6.5 0 4.2 3 6.5 7.5 6.5zM12 13c0-4 3-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5z",
  remind: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  journal: "M6 3h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1zM5 17a2 2 0 0 1 2-2h12M9 7h6M9 10.5h4",
  admin: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
};

// Cozy Cat: Pfote statt Sprössling.
const PAW = "M12 20c-3 0-5-1.6-5-3.6 0-2.4 2.4-4.4 5-4.4s5 2 5 4.4c0 2-2 3.6-5 3.6zM5.5 11.5a1.8 2.2 0 1 0 0 .1zM9 7.5a1.8 2.2 0 1 0 0 .1zM15 7.5a1.8 2.2 0 1 0 0 .1zM18.5 11.5a1.8 2.2 0 1 0 0 .1z";

export function TabIcon({ icon }: { icon: Tab["icon"] }) {
  if (icon === "learn") {
    return (
      <>
        <Icon path={PATHS.learn} className="motif-flower" />
        <Icon path={PATHS.learn} className="motif-clean" />
        <Icon path={PATHS.learn} className="motif-dark" />
        <Icon path={PAW} className="motif-cat" />
      </>
    );
  }
  return <Icon path={PATHS[icon]} />;
}

function Icon({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-6 ${className}`}
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

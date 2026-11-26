import { LearnTabs } from "@/features/shell/learn-tabs";

/** Daily Learning: Unter-Tabs Lektion, Vokabeln, Knowledge, Success. */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LearnTabs />
      {children}
    </>
  );
}

import { getCurrentUser } from "@/features/auth/session";
import { TabBar } from "@/features/shell/tab-bar";
import { tabsFor } from "@/features/shell/tabs";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <>
      <main className="mx-auto w-full max-w-lg px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-28">
        {children}
      </main>
      <TabBar tabs={tabsFor(user.role)} />
    </>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { AdminView } from "@/features/admin/admin-view";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  return <AdminView />;
}

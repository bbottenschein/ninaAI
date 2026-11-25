import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { ProfileError } from "@/features/auth/profile-error";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-on-accent">
          N
        </div>
        <h1 className="text-2xl font-semibold">NinAI</h1>
        <p className="mt-1 text-muted">10 Minuten Englisch & Politik am Tag</p>
      </div>
      {error === "profile" ? <ProfileError /> : <LoginForm />}
    </main>
  );
}

import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { ProfileError } from "@/features/auth/profile-error";
import { Mouse } from "@/features/shell/mouse";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <Mouse className="mx-auto mb-3 size-28 animate-float" />
        <h1 className="text-3xl font-extrabold tracking-tight">
          Nin<span className="text-accent">AI</span>
        </h1>
        <p className="mt-1 font-semibold text-muted">10 Minuten Englisch & Politik am Tag</p>
      </div>
      {error === "profile" ? <ProfileError /> : <LoginForm />}
    </main>
  );
}

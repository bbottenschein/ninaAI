import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { parseTheme, THEME_COLOR, THEME_COOKIE } from "@/features/settings/theme";
import { ServiceWorkerRegistration } from "@/features/shell/service-worker-registration";
import "./globals.css";

// Runde, freundliche Schrift – passt zum verspielten Look.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "NinAI", template: "%s · NinAI" },
  description: "10 Minuten Englisch und Politik am Tag",
  appleWebApp: { capable: true, title: "NinAI", statusBarStyle: "default" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

async function currentTheme() {
  return parseTheme((await cookies()).get(THEME_COOKIE)?.value);
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await currentTheme();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor:
      theme === "auto"
        ? [
            { media: "(prefers-color-scheme: light)", color: THEME_COLOR.flower },
            { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
          ]
        : THEME_COLOR[theme],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Design aus dem Cookie, damit die Seite gleich in den richtigen Farben erscheint.
  const theme = await currentTheme();
  return (
    <html lang="de" data-theme={theme} className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

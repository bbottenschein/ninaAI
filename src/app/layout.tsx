import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1d151f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

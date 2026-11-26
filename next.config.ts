import type { NextConfig } from "next";

// Cache Components ist bewusst aus: Alle Seiten sind nutzerbezogen (Login-Cookie)
// und werden pro Request gerendert. Siehe CLAUDE.md.
const nextConfig: NextConfig = {
  // Der Belohnungs-Bereich heißt jetzt „Success“; alte Lesezeichen leiten weiter.
  async redirects() {
    return [{ source: "/gutscheine", destination: "/success", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

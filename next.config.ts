import type { NextConfig } from "next";

// Cache Components ist bewusst aus: Alle Seiten sind nutzerbezogen (Login-Cookie)
// und werden pro Request gerendert. Siehe CLAUDE.md.
const nextConfig: NextConfig = {
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

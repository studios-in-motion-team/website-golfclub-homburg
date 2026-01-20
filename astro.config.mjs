import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [tailwind()],
  image: {
    // Globale Bildoptimierung
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    // Standard-Qualität und Formate
    domains: [],
    remotePatterns: [],
  },
});

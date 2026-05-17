// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://mrcmalmo.se",
  output: "static",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "sv",
        locales: {
          sv: "sv-SE",
          en: "en-US",
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: "sv",
    locales: ["sv", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
      },
    },
  },
});

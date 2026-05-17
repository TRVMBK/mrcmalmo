import { sv } from "./sv";
import { en } from "./en";

export type Lang = "sv" | "en";

export const languages: Record<Lang, typeof sv> = { sv, en };
export const defaultLang: Lang = "sv";

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split("/");
  if (first === "en") return "en";
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return languages[lang];
}

export function getAlternateUrl(url: URL, targetLang: Lang): string {
  const path = url.pathname;
  if (targetLang === "en") {
    return path.startsWith("/en") ? path : `/en${path === "/" ? "" : path}`;
  }
  return path.startsWith("/en/") ? path.slice(3) || "/" : path;
}

// Maps Swedish route segments to English equivalents
const svToEnPaths: Record<string, string> = {
  "/nyheter": "/news",
  "/om-oss": "/about",
  "/logotyp": "/logo",
};

export function getLocalizedPath(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === "en") {
    const enPath = svToEnPaths[clean] ?? clean;
    return `/en${enPath}`;
  }
  return clean;
}

export function getAlternateUrlMapped(url: URL, targetLang: Lang): string {
  const path = url.pathname;
  if (targetLang === "en") {
    if (path.startsWith("/en")) return path;
    let enPath = path;
    for (const [sv, en] of Object.entries(svToEnPaths)) {
      if (path === sv || path === `${sv}/` || path.startsWith(`${sv}/`)) {
        enPath = path.replace(sv, en);
        break;
      }
    }
    return `/en${enPath === "/" ? "" : enPath}`;
  }
  // Targeting Swedish
  if (!path.startsWith("/en/") && path !== "/en") return path;
  let svPath = path.startsWith("/en/") ? path.slice(3) : "/";
  for (const [sv, en] of Object.entries(svToEnPaths)) {
    if (svPath === en || svPath === `${en}/` || svPath.startsWith(`${en}/`)) {
      svPath = svPath.replace(en, sv);
      break;
    }
  }
  return svPath || "/";
}

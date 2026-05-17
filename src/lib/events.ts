import { getCollection } from "astro:content";
import { fetchFacebookEvents } from "./facebook";
import type { FacebookEvent, ManualEvent, MergedEvent } from "./facebook";

export async function getAllEvents(): Promise<MergedEvent[]> {
  const results: MergedEvent[] = [];

  const fbEvents = await fetchFacebookEvents();
  results.push(...fbEvents);

  const entries = await getCollection("events", (e) => !e.data.draft);
  const manual: ManualEvent[] = entries.map((entry) => ({
    id: entry.id,
    source: "manual" as const,
    title: entry.data.title,
    titleEn: entry.data.titleEn,
    description: entry.data.description,
    descriptionEn: entry.data.descriptionEn,
    date: entry.data.date,
    endDate: entry.data.endDate,
    location: entry.data.location,
    locationUrl: entry.data.locationUrl,
    facebookEventUrl: entry.data.facebookEventUrl,
    image: entry.data.image,
    tags: entry.data.tags,
    featured: entry.data.featured,
  }));

  const manualFbUrls = new Set(
    manual.filter((e) => e.facebookEventUrl).map((e) => e.facebookEventUrl)
  );

  const filtered = [...results.filter((e) => {
    if (e.source === "facebook") {
      const fbEvent = e as FacebookEvent;
      return !manualFbUrls.has(fbEvent.event_url);
    }
    return true;
  }), ...manual];

  const now = new Date();
  return filtered
    .filter((e) => {
      const date = e.source === "facebook"
        ? new Date((e as FacebookEvent).start_time)
        : (e as ManualEvent).date;
      return date >= now;
    })
    .sort((a, b) => {
      const dateA = a.source === "facebook"
        ? new Date((a as FacebookEvent).start_time)
        : (a as ManualEvent).date;
      const dateB = b.source === "facebook"
        ? new Date((b as FacebookEvent).start_time)
        : (b as ManualEvent).date;
      return dateA.getTime() - dateB.getTime();
    });
}

export function getEventDate(event: MergedEvent): Date {
  return event.source === "facebook"
    ? new Date((event as FacebookEvent).start_time)
    : (event as ManualEvent).date;
}

export function getEventTitle(event: MergedEvent, lang: "sv" | "en"): string {
  if (event.source === "facebook") return (event as FacebookEvent).name;
  const e = event as ManualEvent;
  return lang === "en" && e.titleEn ? e.titleEn : e.title;
}

export function getEventDescription(event: MergedEvent, lang: "sv" | "en"): string {
  if (event.source === "facebook") return (event as FacebookEvent).description ?? "";
  const e = event as ManualEvent;
  return lang === "en" && e.descriptionEn ? e.descriptionEn : e.description;
}

export function getEventLocation(event: MergedEvent): string {
  if (event.source === "facebook") {
    const fb = event as FacebookEvent;
    return fb.place?.name ?? "Malmö";
  }
  return (event as ManualEvent).location;
}

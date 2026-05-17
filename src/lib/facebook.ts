export interface FacebookEvent {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time?: string;
  place?: {
    name: string;
    location?: {
      street?: string;
      city?: string;
    };
  };
  cover?: { source: string };
  event_url?: string;
  source: "facebook";
}

export interface ManualEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  date: Date;
  endDate?: Date;
  location: string;
  locationUrl?: string;
  facebookEventUrl?: string;
  image?: string;
  tags: string[];
  featured: boolean;
  source: "manual";
}

export type MergedEvent = FacebookEvent | ManualEvent;

export async function fetchFacebookEvents(): Promise<FacebookEvent[]> {
  const pageId = import.meta.env.FB_PAGE_ID;
  const accessToken = import.meta.env.FB_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return [];
  }

  const since = Math.floor(Date.now() / 1000);
  const fields = "id,name,description,start_time,end_time,place,cover";
  const url = `https://graph.facebook.com/v22.0/${pageId}/events?fields=${fields}&since=${since}&limit=20&access_token=${accessToken}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Facebook] API error: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { data: Omit<FacebookEvent, "source">[] };
    return (data.data ?? []).map((e) => ({ ...e, source: "facebook" as const }));
  } catch {
    return [];
  }
}

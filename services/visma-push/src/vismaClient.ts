import { config } from "./config.js";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.visma.clientId,
    client_secret: config.visma.clientSecret,
    scope: `vismanet:${config.visma.tenantId}:readwrite`,
  });

  const res = await fetch(config.visma.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Visma token error ${res.status}: ${text}`);
  }

  const token = (await res.json()) as TokenResponse;
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(config.visma.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ipp_company_id: config.visma.tenantId,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Visma API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  if (!json.data) throw new Error("No data returned from Visma API");
  return json.data;
}

// ── Paged fetch helper ────────────────────────────────────────────────────────

export async function fetchAllPages<Item>(
  queryFn: (cursor: string | null) => string,
  extractPage: (data: unknown) => { items: Item[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
): Promise<Item[]> {
  const all: Item[] = [];
  let cursor: string | null = null;

  do {
    const data = await gql<unknown>(queryFn(cursor));
    const page = extractPage(data);
    all.push(...page.items);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor !== null);

  return all;
}

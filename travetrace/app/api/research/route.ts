import Anthropic from "@anthropic-ai/sdk";
import { runResearch } from "@/lib/research";
import { ParseError } from "@/lib/parse";
import type { ResearchRequest, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // kräver Fluid compute (på som standard i Vercel)

const SOFT_DEADLINE_MS = 270_000; // rent timeout-fel innan Vercel hårdstoppar vid 300 s
const MAX_QUERY_LENGTH = 200;

// Enkel in-memory rate-limit per IP (per serverinstans – grundskydd för öppen endpoint).
const RATE_LIMIT = 10; // analyser per fönster
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10_000) hits.clear(); // skydda minnet
  return false;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ResearchRequest | null;
  const query = body?.query?.trim();
  const mode = body?.mode;

  if (!query || query.length > MAX_QUERY_LENGTH || (mode !== "snabb" && mode !== "djup")) {
    return Response.json(
      { error: "bad_input", message: "Ange ett företagsnamn eller en URL (max 200 tecken)." },
      { status: 400 },
    );
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "okänd";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "rate_limited", message: "För många analyser – vänta en stund." },
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();
  const abort = AbortSignal.any([req.signal, AbortSignal.timeout(SOFT_DEADLINE_MS)]);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (e: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          closed = true; // klienten har stängt – sluta skriva
        }
      };
      const ping = setInterval(() => emit({ type: "ping" }), 15_000);
      try {
        emit({
          type: "status",
          message: mode === "snabb" ? "Startar snabbanalys…" : "Startar djupanalys…",
        });
        if (mode === "snabb") {
          const data = await runResearch("snabb", query, emit, abort);
          emit({ type: "result", mode: "snabb", data });
        } else {
          const data = await runResearch("djup", query, emit, abort, body?.kontext);
          emit({ type: "result", mode: "djup", data });
        }
      } catch (err) {
        emit(classifyError(err));
      } finally {
        clearInterval(ping);
        emit({ type: "done" });
        if (!closed) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function classifyError(err: unknown): StreamEvent {
  if (err instanceof ParseError) {
    return {
      type: "error",
      code: "parse",
      message: "Analysen blev klar men svaret kunde inte tolkas. Rådata visas nedan.",
      raw: err.raw,
    };
  }
  if (
    err instanceof Anthropic.RateLimitError ||
    (err instanceof Anthropic.APIError && err.status === 529)
  ) {
    return {
      type: "error",
      code: "overloaded",
      message: "AI-tjänsten är hårt belastad just nu – försök igen om en stund.",
    };
  }
  if (err instanceof Anthropic.APIError) {
    console.error("[travetrace] API-fel:", err.status, err.message);
    return {
      type: "error",
      code: "api",
      message: "Ett fel uppstod mot AI-tjänsten. Försök igen.",
    };
  }
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
    return {
      type: "error",
      code: "timeout",
      message: "Analysen tog för lång tid och avbröts. Prova igen, gärna med en mer specifik sökning.",
    };
  }
  console.error("[travetrace] Okänt fel:", err);
  return { type: "error", code: "api", message: "Ett oväntat fel uppstod. Försök igen." };
}

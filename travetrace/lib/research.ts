import Anthropic from "@anthropic-ai/sdk";
import { buildDjupPrompt, buildSnabbPrompt, buildUserPrompt } from "./prompt";
import { extractJson } from "./parse";
import type {
  AnalysLage,
  AnalysResultat,
  Kalla,
  SnabbResultat,
  StreamEvent,
} from "./types";

type Emit = (event: StreamEvent) => void;

interface LageKonfig {
  model: string;
  maxTokens: number;
  maxSearches: number;
  maxFetches: number;
  maxRounds: number;
}

function konfigFor(mode: AnalysLage): LageKonfig {
  if (mode === "snabb") {
    return {
      model: process.env.MODEL_SNABB ?? "claude-sonnet-4-6",
      maxTokens: 8_000,
      maxSearches: 8,
      maxFetches: 2,
      maxRounds: 3,
    };
  }
  return {
    model: process.env.MODEL_DJUP ?? "claude-opus-4-8",
    maxTokens: 16_000,
    maxSearches: 25,
    maxFetches: 8,
    maxRounds: 6,
  };
}

export function troskelMSEK(): number {
  const v = Number(process.env.OMSATTNINGSGRANS_MSEK);
  return Number.isFinite(v) && v > 0 ? v : 25;
}

export async function runResearch(
  mode: "snabb",
  query: string,
  emit: Emit,
  signal: AbortSignal,
): Promise<SnabbResultat>;
export async function runResearch(
  mode: "djup",
  query: string,
  emit: Emit,
  signal: AbortSignal,
  kontext?: SnabbResultat,
): Promise<AnalysResultat>;
export async function runResearch(
  mode: AnalysLage,
  query: string,
  emit: Emit,
  signal: AbortSignal,
  kontext?: SnabbResultat,
): Promise<SnabbResultat | AnalysResultat> {
  const client = new Anthropic();
  const konfig = konfigFor(mode);
  const system =
    mode === "snabb"
      ? buildSnabbPrompt(troskelMSEK())
      : buildDjupPrompt(
          process.env.EGNA_PRODUKTER ??
            "Visma.net, Visma Business NXT, Visma Business, Visma Severa",
        );

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(query, kontext) },
  ];
  const sources = new Map<string, string>(); // url -> titel (dedupe)
  let fullText = "";

  for (let round = 0; round < konfig.maxRounds; round++) {
    const stream = client.messages.stream(
      {
        model: konfig.model,
        max_tokens: konfig.maxTokens,
        thinking: { type: "adaptive" },
        system,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: konfig.maxSearches,
          },
          {
            type: "web_fetch_20260209",
            name: "web_fetch",
            max_uses: konfig.maxFetches,
          },
        ],
        messages,
      },
      { signal },
    );

    // server_tool_use-input anländer via input_json_delta – komplett först vid
    // content_block_stop, så vi ackumulerar per blockindex.
    const pendingTools = new Map<number, { name: string; json: string }>();

    stream.on("streamEvent", (ev) => {
      switch (ev.type) {
        case "content_block_start": {
          const block = ev.content_block;
          if (block.type === "server_tool_use") {
            pendingTools.set(ev.index, { name: block.name, json: "" });
          }
          if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
            for (const r of block.content) {
              if (r.type === "web_search_result" && !sources.has(r.url)) {
                sources.set(r.url, r.title);
                emit({ type: "source", titel: r.title, url: r.url });
              }
            }
          }
          break;
        }
        case "content_block_delta": {
          if (ev.delta.type === "input_json_delta") {
            const t = pendingTools.get(ev.index);
            if (t) t.json += ev.delta.partial_json;
          }
          if (ev.delta.type === "text_delta") {
            fullText += ev.delta.text;
          }
          break;
        }
        case "content_block_stop": {
          const t = pendingTools.get(ev.index);
          if (t) {
            const input = safeParse(t.json);
            if (t.name === "web_search") {
              emit({ type: "search", query: str(input?.query) ?? "…" });
            } else if (t.name === "web_fetch") {
              emit({ type: "fetch", url: str(input?.url) ?? "…" });
            }
            pendingTools.delete(ev.index);
          }
          break;
        }
      }
    });

    const msg = await stream.finalMessage();
    console.log(
      `[travetrace] ${mode} runda ${round + 1}: stop=${msg.stop_reason} in=${msg.usage.input_tokens} out=${msg.usage.output_tokens} cache_read=${msg.usage.cache_read_input_tokens ?? 0}`,
    );

    if (msg.stop_reason === "pause_turn" && round < konfig.maxRounds - 1) {
      // Hela innehållet (inkl. thinking- och tool-block) måste skickas tillbaka orört.
      messages.push({ role: "assistant", content: msg.content });
      emit({
        type: "status",
        message: `Fortsätter analysen (${round + 2}/${konfig.maxRounds})…`,
      });
      continue;
    }
    break;
  }

  emit({ type: "status", message: "Sammanställer resultat…" });
  const parsed = extractJson<SnabbResultat | AnalysResultat>(fullText);
  parsed.kallor = mergeSources(parsed.kallor, sources);
  if (mode === "snabb") {
    const snabb = parsed as SnabbResultat;
    snabb.overTroskel =
      snabb.omsattningMSEK != null && snabb.omsattningMSEK >= troskelMSEK();
  }
  return parsed;
}

function mergeSources(
  fromModel: Kalla[] | undefined,
  harvested: Map<string, string>,
): Kalla[] {
  const seen = new Set<string>();
  const out: Kalla[] = [];
  for (const k of fromModel ?? []) {
    if (k?.url && !seen.has(k.url)) {
      seen.add(k.url);
      out.push({ titel: k.titel || k.url, url: k.url });
    }
  }
  for (const [url, titel] of harvested) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push({ titel: titel || url, url });
    }
  }
  return out;
}

function safeParse(json: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(json);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

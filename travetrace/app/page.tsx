"use client";

import { useCallback, useReducer, useRef } from "react";
import type {
  AnalysLage,
  AnalysResultat,
  SnabbResultat,
  StreamEvent,
} from "@/lib/types";
import { SearchHero } from "@/components/SearchHero";
import { ProgressLog, type LogEntry } from "@/components/ProgressLog";
import { SnabbCard } from "@/components/SnabbCard";
import { ResultGrid } from "@/components/ResultGrid";

interface State {
  phase: "idle" | "running" | "done" | "error";
  mode: AnalysLage;
  query: string;
  log: LogEntry[];
  snabb?: SnabbResultat;
  djup?: AnalysResultat;
  error?: { code: string; message: string; raw?: string };
}

type Action =
  | { type: "start"; query: string; mode: AnalysLage; keepSnabb?: boolean }
  | { type: "event"; event: StreamEvent }
  | { type: "fail"; message: string }
  | { type: "reset" };

const initial: State = { phase: "idle", mode: "snabb", query: "", log: [] };

let logId = 0;
function logEntry(kind: LogEntry["kind"], text: string): LogEntry {
  return { id: ++logId, kind, text, ts: new Date() };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return {
        ...initial,
        phase: "running",
        mode: action.mode,
        query: action.query,
        snabb: action.keepSnabb ? state.snabb : undefined,
        log: [logEntry("status", action.mode === "snabb" ? "Snabbanalys initierad" : "Djupanalys initierad")],
      };
    case "event": {
      const ev = action.event;
      switch (ev.type) {
        case "status":
          return { ...state, log: [...state.log, logEntry("status", ev.message)] };
        case "search":
          return { ...state, log: [...state.log, logEntry("search", `Söker: ${ev.query}`)] };
        case "fetch":
          return { ...state, log: [...state.log, logEntry("fetch", `Hämtar: ${ev.url}`)] };
        case "source":
          return { ...state, log: [...state.log, logEntry("source", `Källa: ${ev.titel}`)] };
        case "result":
          if (ev.mode === "snabb") {
            return { ...state, phase: "done", snabb: ev.data };
          }
          return { ...state, phase: "done", djup: ev.data };
        case "error":
          return {
            ...state,
            phase: "error",
            error: { code: ev.code, message: ev.message, raw: ev.raw },
          };
        default:
          return state;
      }
    }
    case "fail":
      return { ...state, phase: "error", error: { code: "api", message: action.message } };
    case "reset":
      return initial;
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);

  const analysera = useCallback(
    async (query: string, mode: AnalysLage, kontext?: SnabbResultat) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      dispatch({ type: "start", query, mode, keepSnabb: mode === "djup" });

      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, mode, kontext }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          dispatch({
            type: "fail",
            message: data?.message ?? `Begäran misslyckades (${res.status}).`,
          });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line) as StreamEvent;
              dispatch({ type: "event", event: ev });
            } catch {
              // ofullständig/trasig rad – ignorera
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          dispatch({ type: "fail", message: "Kunde inte nå analysservern." });
        }
      }
    },
    [],
  );

  const running = state.phase === "running";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
      <SearchHero
        disabled={running}
        onAnalysera={(query, direktDjup) =>
          analysera(query, direktDjup ? "djup" : "snabb")
        }
      />

      {(running || state.log.length > 1) && state.phase !== "done" && (
        <ProgressLog entries={state.log} active={running} />
      )}

      {state.phase === "error" && state.error && (
        <div className="anim-rise rounded-lg border border-fara/40 bg-panel p-5">
          <p className="font-mono text-sm uppercase tracking-widest text-fara">
            // Fel: {state.error.code}
          </p>
          <p className="mt-2 text-skrift">{state.error.message}</p>
          {state.error.raw && (
            <pre className="mt-4 max-h-64 overflow-auto rounded bg-bakgrund p-3 text-xs text-dampad">
              {state.error.raw}
            </pre>
          )}
          <button
            onClick={() => dispatch({ type: "reset" })}
            className="mt-4 rounded border border-kant px-4 py-2 font-mono text-sm text-dampad transition-colors hover:border-accent hover:text-accent"
          >
            Börja om
          </button>
        </div>
      )}

      {state.snabb && !state.djup && state.phase === "done" && (
        <SnabbCard
          resultat={state.snabb}
          onDjupanalys={() =>
            analysera(
              state.snabb!.foretag.doman ?? state.snabb!.foretag.namn,
              "djup",
              state.snabb,
            )
          }
        />
      )}

      {state.djup && state.phase === "done" && (
        <ResultGrid resultat={state.djup} snabb={state.snabb} />
      )}

      <footer className="mt-auto pt-8 text-center font-mono text-xs text-dampad/60">
        SYSTEMSTATUS: ONLINE // TRAVETRACE – TAKTISK INTELLIGENS FÖR DIN NÄSTA AFFÄR
      </footer>
    </main>
  );
}

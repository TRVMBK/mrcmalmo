"use client";

import { useEffect, useRef } from "react";

export interface LogEntry {
  id: number;
  kind: "status" | "search" | "fetch" | "source";
  text: string;
  ts: Date;
}

const PREFIX: Record<LogEntry["kind"], string> = {
  status: "[SYS]",
  search: "[SÖK]",
  fetch: "[HÄMT]",
  source: "[KÄLLA]",
};

const COLOR: Record<LogEntry["kind"], string> = {
  status: "text-accent",
  search: "text-skrift",
  fetch: "text-skrift",
  source: "text-dampad",
};

export function ProgressLog({ entries, active }: { entries: LogEntry[]; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [entries.length]);

  return (
    <section className="anim-rise rounded-xl border border-kant bg-panel">
      <header className="flex items-center justify-between border-b border-kant px-5 py-3">
        <span className="font-mono text-xs uppercase tracking-widest text-dampad">
          Analyslogg
        </span>
        {active && (
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            ● Pågår
          </span>
        )}
      </header>
      <div ref={ref} className="max-h-72 overflow-y-auto px-5 py-4 font-mono text-xs leading-6">
        {entries.map((e) => (
          <div key={e.id} className={COLOR[e.kind]}>
            <span className="text-dampad/60">
              {e.ts.toLocaleTimeString("sv-SE")}{" "}
            </span>
            <span className="text-accent-mork">{PREFIX[e.kind]}</span> {e.text}
          </div>
        ))}
        {active && <div className="cursor-blink text-accent" />}
      </div>
    </section>
  );
}

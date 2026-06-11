"use client";

import { useState } from "react";
import type { AnalysResultat, SnabbResultat } from "@/lib/types";
import { ErpCard } from "./ErpCard";
import { SourceList } from "./SourceList";

const TREND_SYMBOL = { upp: "▲", ned: "▼", stabil: "—" } as const;
const TREND_COLOR = { upp: "text-accent", ned: "text-fara", stabil: "text-dampad" } as const;

function Card({
  titel,
  accent,
  children,
  className = "",
}: {
  titel: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-kant bg-panel p-6 ${className}`}>
      <p
        className={`font-mono text-xs font-bold uppercase tracking-widest ${accent ?? "text-dampad"}`}
      >
        {titel}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-auto shrink-0 rounded border border-kant px-2 py-1 font-mono text-[10px] uppercase text-dampad transition-colors hover:border-accent hover:text-accent"
      title="Kopiera"
    >
      {copied ? "Kopierad ✓" : "Kopiera"}
    </button>
  );
}

export function ResultGrid({
  resultat,
  snabb,
}: {
  resultat: AnalysResultat;
  snabb?: SnabbResultat;
}) {
  const r = resultat;
  return (
    <div className="anim-rise flex flex-col gap-5">
      <div className="rounded-xl border border-kant bg-panel p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-dampad">
          // Djupanalys
        </p>
        <h2 className="mt-2 text-2xl font-bold text-skrift">{r.foretag.namn}</h2>
        <p className="mt-1 font-mono text-xs text-dampad">
          {[r.foretag.doman, r.foretag.orgnr, r.foretag.bransch, r.foretag.ort, r.foretag.storlek]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <Card titel="◆ Uppsökarförslag" accent="text-accent">
        <ul className="flex flex-col gap-3">
          {r.uppsokarforslag.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border border-kant bg-bakgrund p-3"
            >
              <span className="font-mono text-xs text-accent">#{i + 1}</span>
              <p className="text-sm text-skrift">{f}</p>
              <CopyButton text={f} />
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card titel="◉ Företagsöversikt" className="sm:col-span-2">
          <p className="whitespace-pre-line text-sm leading-relaxed text-skrift">
            {r.foretagsoversikt}
          </p>
        </Card>

        <ErpCard erpSpar={r.erpSpar} />

        <Card titel="↗ Försäljningskrokar" accent="text-accent">
          <ul className="flex list-inside flex-col gap-2 text-sm text-skrift">
            {r.forsaljningskrokar.map((k, i) => (
              <li key={i} className="border-l-2 border-accent-mork pl-3">
                {k}
              </li>
            ))}
          </ul>
        </Card>

        <Card titel="⚠ Smärtpunkter" accent="text-varning">
          <ul className="flex flex-col gap-2 text-sm text-skrift">
            {r.smartpunkter.map((p, i) => (
              <li key={i} className="border-l-2 border-varning/50 pl-3">
                {p}
              </li>
            ))}
          </ul>
        </Card>

        <Card titel="$ Finansiella signaler">
          <p className="text-sm leading-relaxed text-skrift">
            {r.finansiellaSignaler.sammanfattning}
          </p>
          {r.finansiellaSignaler.nyckeltal.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {r.finansiellaSignaler.nyckeltal.map((n) => (
                <div key={n.etikett} className="rounded border border-kant bg-bakgrund p-2">
                  <p className="font-mono text-[10px] uppercase text-dampad">{n.etikett}</p>
                  <p className="font-mono text-sm text-skrift">
                    {n.varde}{" "}
                    {n.trend && (
                      <span className={TREND_COLOR[n.trend]}>{TREND_SYMBOL[n.trend]}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card titel="♪ Företagston">
          <p className="text-sm leading-relaxed text-skrift">{r.foretagston}</p>
          {snabb && (
            <p className="mt-3 border-t border-kant pt-3 font-mono text-xs text-dampad">
              Kvalificering: {snabb.bedomning}
            </p>
          )}
        </Card>
      </div>

      <SourceList kallor={r.kallor} />
    </div>
  );
}

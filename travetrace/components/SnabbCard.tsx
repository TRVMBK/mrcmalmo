"use client";

import type { SnabbResultat } from "@/lib/types";
import { SourceList } from "./SourceList";

const TREND_SYMBOL = { upp: "▲", ned: "▼", stabil: "—" } as const;
const TREND_COLOR = { upp: "text-accent", ned: "text-fara", stabil: "text-dampad" } as const;

export function SnabbCard({
  resultat,
  onDjupanalys,
}: {
  resultat: SnabbResultat;
  onDjupanalys: () => void;
}) {
  const r = resultat;
  return (
    <section className="anim-rise flex flex-col gap-5">
      <div className="rounded-xl border border-kant bg-panel p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-dampad">
          // Snabbkvalificering
        </p>
        <h2 className="mt-2 text-2xl font-bold text-skrift">{r.foretag.namn}</h2>
        <p className="mt-1 font-mono text-xs text-dampad">
          {[r.foretag.doman, r.foretag.orgnr, r.foretag.bransch, r.foretag.ort, r.foretag.storlek]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {r.nyckeltal.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {r.nyckeltal.map((n) => (
              <div key={n.etikett} className="rounded-lg border border-kant bg-bakgrund p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-dampad">
                  {n.etikett}
                </p>
                <p className="mt-1 font-mono text-sm text-skrift">
                  {n.varde}{" "}
                  {n.trend && (
                    <span className={TREND_COLOR[n.trend]}>{TREND_SYMBOL[n.trend]}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 leading-relaxed text-skrift">{r.bedomning}</p>
      </div>

      {r.overTroskel ? (
        <div className="rounded-xl border border-accent/40 bg-panel-ljus p-6">
          <p className="font-mono text-sm text-accent">
            ✓ Bolaget ser intressant ut – kvalificerat för djupanalys.
          </p>
          <button
            onClick={onDjupanalys}
            className="mt-4 w-full rounded-lg bg-accent px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-bakgrund transition-opacity hover:opacity-85 sm:w-auto"
          >
            Kör djupanalys – ERP-spår &amp; säljinsikter
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-varning/40 bg-panel p-6">
          <p className="font-mono text-sm text-varning">
            {r.omsattningMSEK != null
              ? `⚠ Omsätter under tröskeln (ca ${r.omsattningMSEK} MSEK). Analysen stoppades här.`
              : "⚠ Omsättningen kunde inte fastställas. Analysen stoppades här."}
          </p>
          <button
            onClick={onDjupanalys}
            className="mt-4 rounded-lg border border-kant px-6 py-3 font-mono text-sm text-dampad transition-colors hover:border-accent hover:text-accent"
          >
            Kör djupanalys ändå
          </button>
        </div>
      )}

      <SourceList kallor={r.kallor} />
    </section>
  );
}

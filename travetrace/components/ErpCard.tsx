import type { AnalysResultat, Konfidens } from "@/lib/types";

const KONFIDENS_STYLE: Record<Konfidens, string> = {
  hög: "border-accent text-accent",
  medel: "border-varning text-varning",
  låg: "border-dampad text-dampad",
};

const STATUS_TEXT: Record<AnalysResultat["erpSpar"]["egenStatus"], string> = {
  kund: "Kör redan er lösning – merförsäljning",
  konkurrent: "Konkurrentsystem – bytesmöjlighet",
  migreringsmojlighet: "Äldre Visma-produkt – migreringscase (Business NXT)",
  okant: "Okänt system",
};

export function ErpCard({ erpSpar }: { erpSpar: AnalysResultat["erpSpar"] }) {
  return (
    <section className="rounded-xl border-2 border-accent/50 bg-panel-ljus p-6 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-sm font-bold uppercase tracking-widest text-accent">
          ◎ ERP-spår
        </p>
        <span className="rounded border border-kant px-3 py-1 font-mono text-xs text-dampad">
          {STATUS_TEXT[erpSpar.egenStatus] ?? STATUS_TEXT.okant}
        </span>
      </div>

      {erpSpar.detekterade.length === 0 ? (
        <p className="mt-4 text-skrift">
          <span className="font-mono text-dampad">[INGA SPÅR]</span>{" "}
          {erpSpar.slutsats}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-4">
            {erpSpar.detekterade.map((traff) => (
              <div
                key={traff.system}
                className="rounded-lg border border-kant bg-bakgrund p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-skrift">{traff.system}</h3>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${KONFIDENS_STYLE[traff.konfidens] ?? KONFIDENS_STYLE.låg}`}
                  >
                    Konfidens: {traff.konfidens}
                  </span>
                </div>
                <p className="mt-2 text-sm text-skrift">{traff.kommentar}</p>
                {traff.bevis.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {traff.bevis.map((b, i) => (
                      <li
                        key={i}
                        className="border-l-2 border-accent-mork pl-3 text-sm"
                      >
                        <p className="italic text-dampad">”{b.citat}”</p>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-accent hover:underline"
                        >
                          {b.kallaTitel} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-kant pt-4 text-sm leading-relaxed text-skrift">
            <span className="font-mono text-xs uppercase tracking-wider text-dampad">
              Slutsats:{" "}
            </span>
            {erpSpar.slutsats}
          </p>
        </>
      )}
    </section>
  );
}

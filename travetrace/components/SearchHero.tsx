"use client";

import { useState } from "react";

interface Props {
  disabled: boolean;
  onAnalysera: (query: string, direktDjup: boolean) => void;
}

export function SearchHero({ disabled, onAnalysera }: Props) {
  const [query, setQuery] = useState("");
  const [direktDjup, setDirektDjup] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q && !disabled) onAnalysera(q, direktDjup);
  }

  return (
    <section className="rounded-xl border border-kant bg-panel p-6 sm:p-10">
      <div className="flex items-baseline gap-3">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-skrift sm:text-4xl">
          <span className="text-accent">◎</span> TRAVETRACE
        </h1>
      </div>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-dampad">
        Taktisk intelligens för din nästa affär
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Företagsnamn eller URL, t.ex. volvocars.se"
          maxLength={200}
          disabled={disabled}
          className="flex-1 rounded-lg border border-kant bg-bakgrund px-4 py-3 font-mono text-sm text-skrift placeholder:text-dampad/50 focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="rounded-lg bg-accent px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider text-bakgrund transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {disabled ? "Analyserar…" : "Analysera"}
        </button>
      </form>

      <label className="mt-4 flex cursor-pointer items-center gap-2 font-mono text-xs text-dampad">
        <input
          type="checkbox"
          checked={direktDjup}
          onChange={(e) => setDirektDjup(e.target.checked)}
          disabled={disabled}
          className="accent-[#3dff8b]"
        />
        Hoppa över snabbkvalificeringen – kör djupanalys direkt (dyrare, 1–3 min)
      </label>
    </section>
  );
}

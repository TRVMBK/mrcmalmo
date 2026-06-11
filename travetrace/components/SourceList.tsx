import type { Kalla } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SourceList({ kallor }: { kallor: Kalla[] }) {
  if (!kallor?.length) return null;
  return (
    <section className="rounded-xl border border-kant bg-panel p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-dampad">
        // Källor ({kallor.length})
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {kallor.map((k) => (
          <li key={k.url}>
            <a
              href={k.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-kant bg-bakgrund px-3 py-2 transition-colors hover:border-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${hostname(k.url)}&sz=32`}
                alt=""
                width={16}
                height={16}
                className="shrink-0 rounded-sm"
              />
              <span className="truncate text-sm text-skrift group-hover:text-accent">
                {k.titel}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-dampad">
                {hostname(k.url)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

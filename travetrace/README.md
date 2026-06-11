# TraveTrace

AI-driven företagsresearch för B2B-säljare av affärssystem. Skriv in ett företagsnamn eller en URL — TraveTrace researchar bolaget via webbsökning i många källor och levererar formaterade säljinsikter på svenska, inklusive **spår av vilket ERP-/affärssystem bolaget använder** (kundcase hos leverantörer/partners, jobbannonser, pressreleaser, integrationer).

## Två analyslägen

| Läge | Vad | Kostnad (grovt) | Tid |
|---|---|---|---|
| **Snabbanalys** (default) | Kvalificering på siffror: omsättning, resultat, anställda, trend + kort bedömning. Ingen ERP-research. | ~0,1–0,3 USD | < 1 min |
| **Djupanalys** | Full research: uppsökarförslag, översikt, säljkrokar, smärtpunkter, finansiella signaler, företagston + ERP-spår med bevis-citat och källänkar. | ~1–4 USD | 1–3 min |

Snabbanalysen stoppar vid omsättning under tröskeln (default **25 MSEK**) — djupanalys kräver då ett aktivt klick. Över tröskeln erbjuds djupanalysen med en knapp, och den återanvänder snabbanalysens fakta för att spara sökningar.

## Kom igång lokalt

```bash
cd travetrace
npm install
cp .env.example .env   # fyll i ANTHROPIC_API_KEY
npm run dev            # http://localhost:3000
```

## Miljövariabler

| Variabel | Beskrivning | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | API-nyckel från platform.claude.com. **Obligatorisk.** | — |
| `EGNA_PRODUKTER` | Er produktportfölj — styr hur ERP-fynd ramas in (kund / konkurrent / migreringsmöjlighet). | `Visma.net, Visma Business NXT, Visma Business, Visma Severa` |
| `OMSATTNINGSGRANS_MSEK` | Kvalificeringsgräns för snabbanalysen. | `25` |
| `MODEL_SNABB` | Modell för snabbanalys (billigare). | `claude-sonnet-4-6` |
| `MODEL_DJUP` | Modell för djupanalys (mest kapabel). | `claude-opus-4-8` |

Webbsökningen sker via Anthropics inbyggda `web_search`/`web_fetch`-verktyg — ingen separat sök-API-nyckel behövs. Sökavgift ~10 USD per 1 000 sökningar tillkommer ovanpå tokenkostnaden.

## Deploy på Vercel

1. **Add New Project** → importera repot → sätt **Root Directory = `travetrace`** → projektnamn `travetrace`. Next.js detekteras automatiskt.
2. Lägg in miljövariablerna ovan.
3. `maxDuration = 300` kräver **Fluid compute** (på som standard i nya projekt).
4. Rekommenderat: **Settings → Git → Ignored Build Step** på både detta projekt och löparklubbens projekt, så att commits i den ena mappen inte triggar deploy av den andra.

## ⚠ Öppen endpoint

Appen har **ingen inloggning** (medvetet val). Var och en som hittar URL:en kan köra analyser som kostar riktiga API-pengar. Inbyggt grundskydd: max 200 tecken input och en enkel rate-limit (10 analyser / 10 min / IP, per serverinstans). För riktigt skydd: lägg Vercel WAF/rate-limit-regler framför, eller aktivera t.ex. Vercel Password Protection.

## Arkitektur i korthet

- Next.js (App Router) + TypeScript + Tailwind v4, helt fristående i denna mapp.
- `POST /api/research` streamar NDJSON-events (`status`/`search`/`fetch`/`source`/`result`/`error`) så UI:t visar live-progress.
- Claude kör webbsökningarna server-side; vid `pause_turn` fortsätter loopen automatiskt (max 6 rundor).
- Resultatet är JSON enligt schema i systemprompten; källor skördas dessutom programmatiskt ur sökresultaten.
- Alla ERP-påståenden kräver ordagrant citat + käll-URL i prompten — säljaren kan verifiera varje fynd med ett klick.

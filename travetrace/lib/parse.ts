export class ParseError extends Error {
  readonly raw: string;

  constructor(message: string, raw: string) {
    super(message);
    this.name = "ParseError";
    this.raw = raw;
  }
}

/**
 * Extraherar modellens avslutande JSON-objekt ur den ackumulerade svarstexten.
 * Primärt: sista ```json-staketet. Fallback: sista balanserade {...}-blocket.
 * (Uppgraderingsväg om parse-fel blir vanliga: output_config.format med json_schema.)
 */
export function extractJson<T>(text: string): T {
  const fenced = lastFencedBlock(text);
  if (fenced) {
    const parsed = tryParse<T>(fenced);
    if (parsed !== undefined) return parsed;
  }
  const balanced = lastBalancedObject(text);
  if (balanced) {
    const parsed = tryParse<T>(balanced);
    if (parsed !== undefined) return parsed;
  }
  throw new ParseError("Kunde inte tolka analysens JSON-svar", text.slice(-2000));
}

function tryParse<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

function lastFencedBlock(text: string): string | null {
  const re = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let last: string | null = null;
  for (const m of text.matchAll(re)) {
    const body = m[1].trim();
    if (body.startsWith("{")) last = body;
  }
  if (last) return last;
  // Hantera avhugget svar: öppnande staket utan stängning
  const open = text.lastIndexOf("```json");
  if (open !== -1) {
    const body = text.slice(open + 7).trim();
    if (body.startsWith("{")) return body;
  }
  return null;
}

function lastBalancedObject(text: string): string | null {
  const end = text.lastIndexOf("}");
  if (end === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = end; i >= 0; i--) {
    const ch = text[i];
    if (inString) {
      // Bakåtskanning av strängar är opålitlig för escape-sekvenser; vi accepterar
      // att fallbacken kan missa exotiska fall – tryParse avgör ändå giltigheten.
      if (ch === '"' && text[i - 1] !== "\\") inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "}") depth++;
    if (ch === "{") {
      depth--;
      if (depth === 0) return text.slice(i, end + 1);
    }
    if (escaped) escaped = false;
  }
  return null;
}

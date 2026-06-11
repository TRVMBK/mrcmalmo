export type AnalysLage = "snabb" | "djup";

export type Trend = "upp" | "ned" | "stabil";

export interface Nyckeltal {
  etikett: string;
  varde: string;
  trend?: Trend;
}

export interface Kalla {
  titel: string;
  url: string;
}

export interface Foretag {
  namn: string;
  doman?: string;
  orgnr?: string;
  bransch?: string;
  ort?: string;
  storlek?: string;
}

/** Resultat från snabbanalysen (kvalificering på siffror, ingen ERP-research). */
export interface SnabbResultat {
  foretag: Foretag;
  /** Senaste kända årsomsättning i MSEK, null om den inte gick att hitta. */
  omsattningMSEK: number | null;
  nyckeltal: Nyckeltal[];
  /** true om omsättningen är minst OMSATTNINGSGRANS_MSEK. */
  overTroskel: boolean;
  /** 2–3 meningar: ser bolaget intressant ut för en affärssystemsaffär, och varför. */
  bedomning: string;
  kallor: Kalla[];
}

export type Konfidens = "hög" | "medel" | "låg";

export interface ErpBevis {
  citat: string;
  kallaTitel: string;
  url: string;
}

export interface ErpTraff {
  system: string;
  konfidens: Konfidens;
  bevis: ErpBevis[];
  kommentar: string;
}

export type EgenStatus = "kund" | "konkurrent" | "migreringsmojlighet" | "okant";

/** Resultat från djupanalysen (full research + ERP-spår). */
export interface AnalysResultat {
  foretag: Foretag;
  uppsokarforslag: string[];
  foretagsoversikt: string;
  forsaljningskrokar: string[];
  smartpunkter: string[];
  finansiellaSignaler: {
    sammanfattning: string;
    nyckeltal: Nyckeltal[];
  };
  foretagston: string;
  erpSpar: {
    detekterade: ErpTraff[];
    slutsats: string;
    egenStatus: EgenStatus;
  };
  kallor: Kalla[];
}

/** Events som streamas som NDJSON från /api/research till klienten. */
export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "fetch"; url: string }
  | { type: "source"; titel: string; url: string }
  | { type: "ping" }
  | { type: "result"; mode: "snabb"; data: SnabbResultat }
  | { type: "result"; mode: "djup"; data: AnalysResultat }
  | {
      type: "error";
      code: "bad_input" | "timeout" | "api" | "parse" | "overloaded";
      message: string;
      /** Vid parse-fel: råtextens svans så UI:t kan visa något i stället för tom skärm. */
      raw?: string;
    }
  | { type: "done" };

export interface ResearchRequest {
  query: string;
  mode: AnalysLage;
  /** Snabbanalysens resultat – skickas med vid djupanalys så modellen slipper söka om grunderna. */
  kontext?: SnabbResultat;
}

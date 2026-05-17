export type TrainingSession = {
  daySv: string;
  dayEn: string;
  time: string;
  locationSv: string;
  locationEn: string;
  address: string;
  noteSv?: string;
  noteEn?: string;
  groups: Array<{
    nameSv: string;
    nameEn: string;
    detailSv: string;
    detailEn: string;
  }>;
  highlight?: boolean;
  isDenmark?: boolean;
};

// ── Redigera detta för att uppdatera träningsschemat ──────────────────────────
export const trainingSessions: TrainingSession[] = [
  {
    daySv: "Onsdag",
    dayEn: "Wednesday",
    time: "18:30",
    locationSv: "Moriskan eller Ramen to Bíiru",
    locationEn: "Moriskan or Ramen to Bíiru",
    address: "Sommar: Folkets Park · Vinter: Möllevångstorget",
    noteSv: "Sista onsdagen/mån: start från Ukrainan Beer Bar istället",
    noteEn: "Last Wednesday/month: start from Ukrainan Beer Bar instead",
    groups: [
      {
        nameSv: "Ghost vision style",
        nameEn: "Ghost vision style",
        detailSv: "5:45/km",
        detailEn: "5:45/km",
      },
      {
        nameSv: "Malmö i love you",
        nameEn: "Malmö i love you",
        detailSv: "6:30/km",
        detailEn: "6:30/km",
      },
    ],
    highlight: true,
  },
  {
    daySv: "3:e lördagen/mån",
    dayEn: "3rd Saturday/month",
    time: "12:00",
    locationSv: "Moriskan eller Hylliebryggeriet",
    locationEn: "Moriskan or Hylliebryggeriet",
    address: "Sommar: Folkets Park · Vinter: Hylliebryggeriet",
    groups: [
      {
        nameSv: "Ghost vision style",
        nameEn: "Ghost vision style",
        detailSv: "5:45/km",
        detailEn: "5:45/km",
      },
      {
        nameSv: "Malmö i love you",
        nameEn: "Malmö i love you",
        detailSv: "6:30/km",
        detailEn: "6:30/km",
      },
    ],
    highlight: true,
  },
  {
    daySv: "1:a lördagen/mån",
    dayEn: "1st Saturday/month",
    time: "",
    locationSv: "Warpigs",
    locationEn: "Warpigs",
    address: "Köpenhamn, Danmark",
    noteSv: "Första ölen är gratis!",
    noteEn: "First beer is free!",
    groups: [
      {
        nameSv: "Alla nivåer",
        nameEn: "All levels",
        detailSv: "Spring med moderklubben i Köpenhamn",
        detailEn: "Run with the mother club in Copenhagen",
      },
    ],
    isDenmark: true,
  },
];

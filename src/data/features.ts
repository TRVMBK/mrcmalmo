export type Feature = {
  icon: "beer" | "free" | "groups" | "globe" | "pin" | "team";
  titleSv: string;
  bodySv: string;
  titleEn: string;
  bodyEn: string;
};

export const features: Feature[] = [
  {
    icon: "beer",
    titleSv: "Gemenskap och dryck",
    bodySv: "Vi avslutar alltid med en dryck – öl, alkoholfritt eller vatten, helt självvalt. Men det verkliga värdet är gemenskapen. Här hittar du vänner för livet.",
    titleEn: "Community and drinks",
    bodyEn: "We always finish with a drink – beer, non-alcoholic or water, entirely your choice. But the real value is the community. Here you'll find friends for life.",
  },
  {
    icon: "free",
    titleSv: "Helt gratis",
    bodySv: "All löpning med MRC Malmö är gratis. Inga avgifter, inga dolda kostnader. Du betalar bara din egen öl.",
    titleEn: "Completely free",
    bodyEn: "All running with MRC Malmö is free. No fees, no hidden costs. You only pay for your own beer.",
  },
  {
    icon: "groups",
    titleSv: "Flera grupper",
    bodySv: '"Ghost vision style" springer 5:45/km, en mellannivå runt 6:00/km, och "Malmö i love you" håller 6:30/km. Ofta tre grupper – alla hittar sin nivå.',
    titleEn: "Multiple groups",
    bodyEn: '"Ghost vision style" runs at 5:45/km, a mid-level group around 6:00/km, and "Malmö i love you" keeps to 6:30/km. Often three groups – everyone finds their level.',
  },
  {
    icon: "globe",
    titleSv: "Köpenhamn månadsvis",
    bodySv: "Första lördagen varje månad åker vi till Köpenhamn och springer med moderklubben. Första ölen är alltid gratis!",
    titleEn: "Copenhagen monthly",
    bodyEn: "The first Saturday each month we head to Copenhagen to run with the mother club. First beer is always free!",
  },
  {
    icon: "pin",
    titleSv: "Centrala mötesplatser",
    bodySv: "Vi träffas på Möllevångstorget och i Folkets Park — mysiga platser där öl, alkoholfritt och andra alternativ väntar efteråt.",
    titleEn: "Central meeting spots",
    bodyEn: "We meet at Möllevångstorget and in Folkets Park — cozy spots where beer, non-alcoholic and other alternatives await afterwards.",
  },
  {
    icon: "team",
    titleSv: "Ingen lämnas efter",
    bodySv: "Vår viktigaste regel: \"No one is left behind\". Vi springer tillsammans och avslutar alltid tillsammans.",
    titleEn: "No one left behind",
    bodyEn: "Our most important rule: \"No one is left behind\". We run together and always finish together.",
  },
];

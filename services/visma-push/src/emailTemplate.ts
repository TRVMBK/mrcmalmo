import { config } from "./config.js";
import type { CustomerPattern } from "./analyzer.js";

function formatDate(date: Date): string {
  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function intervalLabel(days: number): string {
  if (days < 14) return "varje vecka";
  if (days < 21) return "varannan vecka";
  if (days < 45) return "ungefär en gång i månaden";
  if (days < 75) return "ungefär varannan månad";
  return `ungefär var ${Math.round(days / 30)} månad`;
}

export function buildEmailHtml(pattern: CustomerPattern, customerName: string): string {
  const { companyName, senderName, senderTitle, orderUrl } = config.email;
  const lastOrderFormatted = formatDate(pattern.lastOrderDate);
  const cadence = intervalLabel(pattern.avgIntervalDays);

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dags att beställa?</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1e2d4a;padding:28px 36px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.1em;color:#a8b8d0;text-transform:uppercase;">${companyName}</p>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#ffffff;">Hej ${customerName}! 👋</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Hoppas att allt är bra med dig!
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Jag är lite nyfiken på att höra hur
                <strong>${pattern.topProduct.description}</strong>
                säljer i butiken? Ni brukar beställa
                <strong>${cadence}</strong>
                och det har nu gått
                <strong>${pattern.daysSinceLastOrder} dagar</strong>
                sedan er senaste beställning den ${lastOrderFormatted} — är det kanske snart dags att fylla på hyllorna?
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#374151;line-height:1.6;">
                Hör gärna av dig så hjälper jag dig med det!
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#1e2d4a;">
                    <a href="${orderUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      📦 Lägg en beställning
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer / Signature -->
          <tr>
            <td style="background:#f9fafb;padding:24px 36px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 2px;font-size:14px;color:#6b7280;">Med vänliga hälsningar</p>
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111827;">${senderName}</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">${companyName} · ${senderTitle}</p>
            </td>
          </tr>

        </table>

        <!-- Tiny unsubscribe hint -->
        <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center;">
          Du får detta mail för att du är en aktiv kund hos ${companyName}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmailText(pattern: CustomerPattern, customerName: string): string {
  const { companyName, senderName, senderTitle, orderUrl } = config.email;
  const lastOrderFormatted = formatDate(pattern.lastOrderDate);
  const cadence = intervalLabel(pattern.avgIntervalDays);

  return `Hej ${customerName}!

Hoppas att allt är bra med dig!

Jag är lite nyfiken på att höra hur ${pattern.topProduct.description} säljer i butiken? Ni brukar beställa ${cadence} och det har nu gått ${pattern.daysSinceLastOrder} dagar sedan er senaste beställning den ${lastOrderFormatted} — är det kanske snart dags att fylla på hyllorna?

Hör gärna av dig så hjälper jag dig med det!

Lägg en beställning: ${orderUrl}

---
Med vänliga hälsningar
${senderName}
${companyName} · ${senderTitle}
`;
}

export function buildSubjectLine(pattern: CustomerPattern): string {
  if (pattern.daysSinceLastOrder > pattern.avgIntervalDays * 2) {
    return `Vi saknar dig, ${pattern.customerName.split(" ")[0]}! Dags att beställa?`;
  }
  return `Dags att fylla på? 📦 – ${pattern.daysSinceLastOrder} dagar sedan senaste order`;
}

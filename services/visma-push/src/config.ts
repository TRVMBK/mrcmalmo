const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  visma: {
    clientId: required("VISMA_CLIENT_ID"),
    clientSecret: required("VISMA_CLIENT_SECRET"),
    tenantId: required("VISMA_TENANT_ID"),
    tokenUrl: "https://connect.visma.com/connect/token",
    apiUrl: "https://integration.visma.net/API/controller/api/graphql",
  },
  email: {
    resendApiKey: required("RESEND_API_KEY"),
    from: process.env.EMAIL_FROM ?? "Påminnelse <no-reply@example.se>",
    replyTo: process.env.EMAIL_REPLY_TO,
    senderName: process.env.SENDER_NAME ?? "Säljteamet",
    senderTitle: process.env.SENDER_TITLE ?? "B2B",
    companyName: process.env.COMPANY_NAME ?? "Ditt Företag",
    orderUrl: process.env.ORDER_URL ?? "https://example.se/bestall",
  },
  overdueThresholdPct: Number(process.env.OVERDUE_THRESHOLD_PCT ?? "30"),
  lookbackMonths: Number(process.env.LOOKBACK_MONTHS ?? "6"),
  dryRun: process.env.DRY_RUN === "true",
};

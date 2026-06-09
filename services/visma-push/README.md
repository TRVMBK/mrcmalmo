# Visma Push System

Automatiska beställningspåminnelser för B2B-kunder baserat på data från Visma Business NXT.

## Hur det fungerar

1. Hämtar alla försäljningsordrar från de senaste N månaderna via Visma NXT GraphQL-API
2. Beräknar för varje kund: genomsnittligt interval mellan ordrar + senaste orderdatum
3. Flaggar kunder vars senaste order är >130% av deras genomsnittliga interval sedan
4. Skickar ett personligt HTML-mail via [Resend](https://resend.com) med:
   - Kundens namn och mest beställda produkt
   - Hur länge sedan senaste order var
   - CTA-knapp för att lägga en ny order

## Setup

### 1. Visma NXT API-credentials

Registrera din applikation på [Visma Developer Portal](https://developer.visma.com) och begär scope `vismanet:<tenant_id>:readwrite`.

### 2. E-post via Resend

Skapa ett gratis konto på [resend.com](https://resend.com) (3 000 mail/mån gratis).

### 3. Miljövariabler

```bash
cp .env.example .env
# Fyll i dina värden i .env
```

### 4. Kör

```bash
npm install
npm run dev          # Kör direkt med tsx
npm run build        # Bygg till dist/
npm run run:prod     # Kör byggd version
```

### Dry run

Sätt `DRY_RUN=true` i `.env` för att se vilka mail som *skulle* skickas utan att faktiskt skicka dem.

## Schemaläggning (cron)

Kör en gång per dag med t.ex. systemd timer eller GitHub Actions:

```yaml
# .github/workflows/push-reminders.yml
on:
  schedule:
    - cron: "0 8 * * 1-5"   # Vardagar 08:00

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: services/visma-push
      - run: npm run dev
        working-directory: services/visma-push
        env:
          VISMA_CLIENT_ID: ${{ secrets.VISMA_CLIENT_ID }}
          VISMA_CLIENT_SECRET: ${{ secrets.VISMA_CLIENT_SECRET }}
          VISMA_TENANT_ID: ${{ secrets.VISMA_TENANT_ID }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
          SENDER_NAME: ${{ secrets.SENDER_NAME }}
          COMPANY_NAME: ${{ secrets.COMPANY_NAME }}
          ORDER_URL: ${{ secrets.ORDER_URL }}
```

## Konfiguration

| Variabel | Beskrivning | Default |
|---|---|---|
| `OVERDUE_THRESHOLD_PCT` | Hur många % försenad en kund måste vara | `30` |
| `LOOKBACK_MONTHS` | Hur många månader bakåt att analysera | `6` |
| `DRY_RUN` | Logga men skicka inte mail | `false` |

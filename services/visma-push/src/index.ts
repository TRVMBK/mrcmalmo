import "dotenv/config";
import { fetchRecentOrders, fetchCustomerEmails } from "./fetchOrders.js";
import { analyzeCustomers } from "./analyzer.js";
import { buildEmailHtml, buildEmailText, buildSubjectLine } from "./emailTemplate.js";
import { sendEmail } from "./mailer.js";
import { config } from "./config.js";

async function run(): Promise<void> {
  console.log(`\n=== Visma Push System ===`);
  console.log(`Lookback: ${config.lookbackMonths} months`);
  console.log(`Overdue threshold: ${config.overdueThresholdPct}% past avg interval`);
  console.log(`Dry run: ${config.dryRun}\n`);

  // 1. Fetch recent orders from Visma NXT
  console.log("📦 Hämtar ordrar från Visma NXT...");
  const orders = await fetchRecentOrders();
  console.log(`   ${orders.length} ordrar hittades med riktiga produktrader\n`);

  // 2. Analyse order patterns
  const patterns = analyzeCustomers(orders);
  const overdue = patterns.filter((p) => p.isOverdue);

  console.log(`📊 Analysresultat:`);
  console.log(`   ${patterns.length} kunder med regelbundna köpmönster`);
  console.log(`   ${overdue.length} kunder är försenade med sin beställning\n`);

  if (overdue.length === 0) {
    console.log("✅ Inga kunder behöver påminnelse idag.");
    return;
  }

  // 3. Fetch email addresses for overdue customers
  console.log("📧 Hämtar e-postadresser...");
  const customerIds = [...new Set(overdue.map((p) => p.customerId))];
  const contacts = await fetchCustomerEmails(customerIds);

  // 4. Send emails
  console.log(`\n📬 Skickar påminnelsemail:\n`);
  let sent = 0;
  let skipped = 0;

  for (const pattern of overdue) {
    const contact = contacts.get(pattern.customerId);
    const email = contact?.email;

    if (!email) {
      console.log(`  ⚠️  ${pattern.customerName} — ingen e-postadress hittades, hoppar över`);
      skipped++;
      continue;
    }

    const contactName = contact.contactName ?? pattern.customerName;
    const subject = buildSubjectLine(pattern);
    const html = buildEmailHtml(pattern, contactName);
    const text = buildEmailText(pattern, contactName);

    try {
      await sendEmail({ to: email, subject, html, text });
      console.log(
        `  ✅ ${pattern.customerName} <${email}> — ${pattern.daysSinceLastOrder} dagar sedan senaste order (avg ${pattern.avgIntervalDays} d)`
      );
      sent++;
    } catch (err) {
      console.error(`  ❌ ${pattern.customerName} <${email}> — ${(err as Error).message}`);
      skipped++;
    }
  }

  console.log(`\n=== Klart: ${sent} mail skickade, ${skipped} hoppades över ===\n`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

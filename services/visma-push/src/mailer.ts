import { Resend } from "resend";
import { config } from "./config.js";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) resend = new Resend(config.email.resendApiKey);
  return resend;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (config.dryRun) {
    console.log(`[DRY RUN] Would send to ${payload.to}: "${payload.subject}"`);
    return;
  }

  const { error } = await getResend().emails.send({
    from: config.email.from,
    reply_to: config.email.replyTo,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

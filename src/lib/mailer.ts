// src/lib/mailer.ts (server-only)
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;

const resend = new Resend(apiKey || "");

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  if (!apiKey) throw new Error("Resend not configured: RESEND_API_KEY missing");
  if (!from) throw new Error("Resend not configured: RESEND_FROM missing");
  if (!to) throw new Error("Resend: 'to' is empty");

  try {
    const res = await resend.emails.send({ from, to, subject, html });
    if ((res as any)?.error) {
      const e = (res as any).error;
      throw new Error(`Resend error: ${e?.message || e?.name || "Unknown"}${e?.type ? ` (${e.type})` : ""}`);
    }
    return res;
  } catch (err: any) {
    console.error("[mailer] send failed:", { message: err?.message, stack: err?.stack });
    throw err;
  }
}
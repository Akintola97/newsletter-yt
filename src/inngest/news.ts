// src/inngest/news.ts
import { inngest } from "./client";
import { fetchArticles } from "./function";
import { prisma } from "@/lib/prisma";
import { topicsToCategories } from "@/lib/topics";
import { buildNewsletterHtml } from "@/lib/newsletter-html";
import { sendEmail } from "@/lib/mailer";
import { nextSendAtFrom } from "@/lib/frequency";

type EventData = { userId?: string; kindeId?: string; topicsInline?: string };

export default inngest.createFunction(
  { id: "newsletter" },   // single canonical id
  { event: "scheduled.newsletter" },
  async ({ event, step, runId }) => {
    const data = (event.data as EventData) || {};
    let internalUserId = data.userId || null;

    // Resolve Prisma user id if only kindeId is provided
    if (!internalUserId && data.kindeId) {
      const found = (await step.run("resolve-user-by-kinde", () =>
        prisma.user.findUnique({
          where: { kindeId: data.kindeId! },
          select: { id: true },
        })
      )) as { id: string } | null;
      internalUserId = found?.id ?? null;
    }

    if (!internalUserId) {
      console.log("[newsletter] missing internal user id; skipping", { runId, dataKeys: Object.keys(data) });
      return;
    }

    // Load preferences + user
    const { pref, user } = await step.run("load-user-and-preferences", async () => {
      const [pref, user] = await Promise.all([
        prisma.preference.findUnique({
          where: { userId: internalUserId! },
          select: { topics: true, paused: true, frequency: true },
        }),
        prisma.user.findUnique({
          where: { id: internalUserId! },
          select: { email: true, name: true },
        }),
      ]);
      return { pref, user };
    }) as {
      pref: { topics?: string | null; paused?: boolean | null; frequency?: string | null } | null;
      user: { email?: string | null; name?: string | null } | null;
    };

    if (!pref) { console.log("[newsletter] no preferences; skipping", { internalUserId, runId }); return; }
    if (pref.paused) { console.log("[newsletter] paused; skipping", { internalUserId, runId }); return; }
    if (!user?.email) { console.log("[newsletter] no email; skipping", { internalUserId, runId }); return; }

    // --- Topics source & normalization ---
    // Always snapshot EXACTLY what the user saved in Preference.topics
    const topicsRaw = (pref.topics ?? "").trim() || null;

    // Normalize for fetching/summarizing
    const categories = topicsToCategories(topicsRaw || "");
    const effectiveTopics = categories.length ? categories : ["technology", "business", "politics"];

    // Fetch articles
    const allArticles = await step.run("fetch-news", () => fetchArticles(effectiveTopics));

    // Summarize via AI
    const ai = await step.ai.infer("summarize-news", {
      model: step.ai.models.openai({ model: "gpt-4o" }),
      body: {
        messages: [
          {
            role: "system",
            content:
              "You are an expert newsletter editor. Produce a concise, engaging, sectioned newsletter body (no HTML, plain text). Include short headers and bulleted takeaways. End with 3–5 quick links.",
          },
          {
            role: "user",
            content:
              `Create a newsletter summary.\n` +
              `Topics: ${(effectiveTopics || []).join(", ")}\n` +
              `Articles:\n` +
              (allArticles ?? [])
                .map((a: any, i: number) => `${i + 1}. ${a.title}\n${a.description}\n${a.url}\n`)
                .join("\n"),
          },
        ],
      },
    });

    const bodyText = ai.choices?.[0]?.message?.content?.trim() || "No summary available.";
    await step.run("log-summary", async()=>{
        console.log("[newsletter] generated summary:\n", bodyText);
    })
    const subject = `Your ${(pref.frequency || "DAILY").toLowerCase()} AI Newsletter — ${new Date().toLocaleDateString()}`;
    const html = buildNewsletterHtml({ title: subject, body: bodyText });

    // Persist Issue WITH subject + topics snapshot
    const issue = (await step.run("create-issue", () =>
      prisma.issue.create({
        data: {
          title: subject,
          subject,            // snapshot subject
          topics: topicsRaw,  // EXACT Preference.topics string (can be null)
          html,
          metaJson: JSON.stringify({
            topics: effectiveTopics, // normalized list used for fetch/summarize
            count: (allArticles ?? []).length,
            generatedAt: new Date().toISOString(),
          }),
        },
        select: { id: true },
      })
    )) as { id: string };

    // Send email
    let deliveryStatus: "SENT" | "FAILED" = "SENT";
    let deliveryError: string | null = null;

    try {
      await step.run("send-email", () =>
        sendEmail({ to: user.email!, subject, html })
      );
    } catch (err: any) {
      deliveryStatus = "FAILED";
      deliveryError = err?.message || String(err);
    }

    const now = new Date();
    const recipientEmail = (user?.email ?? "").trim() || null;
    const recipientName = (user?.name ?? "").trim() || null;

    // Persist Delivery WITH topics snapshot
    await step.run("record-delivery", () =>
      prisma.delivery.create({
        data: {
          userId: internalUserId!,
          issueId: issue.id,
          status: deliveryStatus,
          error: deliveryError,
          subject: subject || "AI Newsletter",
          toEmail: recipientEmail,
          toName: recipientName,
          topics: topicsRaw,  // EXACT Preference.topics string (can be null)
          sentAt: now,
        },
        select: { id: true },
      })
    );

    // Advance schedule
    if (deliveryStatus === "SENT") {
      await step.run("bump-preference-schedule-success", () =>
        prisma.preference.update({
          where: { userId: internalUserId! },
          data: {
            lastSentAt: now,
            nextSendAt: nextSendAtFrom(pref.frequency as any, now),
          },
        })
      );
    } else {
      const retryAt = new Date(now.getTime() + 15 * 60_000);
      await step.run("bump-preference-schedule-retry", () =>
        prisma.preference.update({
          where: { userId: internalUserId! },
          data: { nextSendAt: retryAt },
        })
      );
    }

    console.log("[newsletter] finished", { userId: internalUserId, status: deliveryStatus, runId });
  }
);

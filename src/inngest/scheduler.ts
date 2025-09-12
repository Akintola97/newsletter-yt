// src/inngest/scheduler.ts
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";

const CRON = "*/10 * * * *";        // every 10 min
const BATCH_SIZE = 500;
const LOCK_AHEAD_MINUTES = 10;      // avoid double-enqueue during overlap

export default inngest.createFunction(
  { id: "newsletter-scheduler" },
  { cron: CRON },
  async ({ step }) => {
    const now = new Date();

    while (true) {
      const due = await step.run("find-due-preferences", () =>
        prisma.preference.findMany({
          where: {
            paused: false,
            OR: [{ nextSendAt: { lte: now } }, { nextSendAt: null }],
          },
          select: { userId: true, nextSendAt: true },
          take: BATCH_SIZE,
        })
      ) as Array<{ userId: string; nextSendAt: Date | null }>;

      if (!due.length) {
        console.log("[scheduler] no due preferences");
        break;
      }

      const lockUntil = new Date(now.getTime() + LOCK_AHEAD_MINUTES * 60_000);

      const lockedUserIds: string[] = [];
      for (const p of due) {
        const updated = await step.run(`lock-${p.userId}`, () =>
          prisma.preference.updateMany({
            where: {
              userId: p.userId,
              paused: false,
              OR: [{ nextSendAt: { lte: now } }, { nextSendAt: null }],
            },
            data: { nextSendAt: lockUntil },
          })
        ) as { count: number };

        if (updated.count === 1) lockedUserIds.push(p.userId);
      }

      if (!lockedUserIds.length) {
        console.log("[scheduler] due rows found, none locked (race?)");
        continue; // try next batch
      }

      await step.run("enqueue-events", async () => {
        await Promise.all(
          lockedUserIds.map((userId) =>
            inngest.send({ name: "scheduled.newsletter", data: { userId } })
          )
        );
        console.log("[scheduler] enqueued:", lockedUserIds.length);
      });

      if (due.length < BATCH_SIZE) break;
    }
  }
)
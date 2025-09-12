import { nextSendAtFrom } from "@/lib/frequency";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma"
import { inngest } from "@/inngest/client";

export const runtime = "nodejs";
export const revalidate = 0;

const FREQS = new Set(["DAILY", "BIWEEKLY", "MONTHLY"]);

function sanitizeTopics(input) {
  if (typeof input !== "string") return null;
  const list = Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
  const joined = list.join(",");
  return joined.slice(0, 600);
}

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const u = await getUser();
    if (!u?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    const existing = await prisma.user.findUnique({
      where: { kindeId: u.id },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: {
          select: {
            frequency: true,
            topics: true,
            paused: true,
            lastSentAt: true,
            nextSendAt: true,
          },
        },
      },
    });
    return NextResponse.json(
      {
        ok: true,
        preference: existing?.preferences ?? null,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[preferences.GET] error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { getUser } = getKindeServerSession();
    const u = await getUser();
    if (!u?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const body = await req.json().catch(() => ({}));
    const frequency = FREQS.has(body.frequency) ? body.frequency : "DAILY";
    const topics = sanitizeTopics(body.topics);
    const paused = Boolean(body.paused);

    let user = await prisma.user.findUnique({ where: { kindeId: u.id } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          kindeId: u.id,
          email: u.email ?? "",
          name:
            u.given_name || u.family_name
              ? `${u.given_name ?? ""} ${u.family_name ?? ""}`.trim()
              : null,
        },
      });
    }

    const pref = await prisma.preference.upsert({
      where: { userId: user.id },
      update: {
        frequency,
        topics,
        paused,
        ...(body._forceInit === true
          ? { nextSendAt: nextSendAtFrom(frequency) }
          : {}),
      },
      create: {
        userId: user.id,
        frequency,
        topics,
        paused,
        nextSendAt: nextSendAtFrom(frequency),
      },
      select: { frequency: true, topics: true, paused: true, nextSendAt: true },
    });
    if (!pref.nextSendAt && !paused) {
      await prisma.preference.update({
        where: { userId: user.id },
        data: { nextSendAt: nextSendAtFrom(frequency) },
      });
    }

    let enqueued = false;
    let eventId = null;

    if (!paused) {
      try {
        const sent = await inngest.send({
          name: "scheduled.newsletter",
          data: { userId: user.id },
        });
        eventId = (sent && sent.ids?.[0]) || null;
        enqueued = Boolean(eventId);
      } catch (err) {
        console.error(
          "[preferences.POST] inngest.send failed",
          err?.message || err
        );
      }
    }
    return NextResponse.json({ ok: true, enqueued, eventId }, { status: 200 });
  } catch (e) {
    console.error("[preferences.POST] error", e);
    return NextResponse.json(
      { ok: false, error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

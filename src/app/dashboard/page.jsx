"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PauseCircle, Sparkles, Tag } from "lucide-react";
import { useState, useEffect } from "react";

const FREQUENCIES = [
  {
    value: "DAILY",
    label: "Daily",
  },
  {
    value: "BIWEEKLY",
    label: "Biweekly",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
  },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [frequency, setFrequency] = useState("DAILY");
  const [topics, setTopics] = useState("");
  const [notice, setNotice] = useState(null);
  const [effectiveTopics, setEffectiveTopics] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/preferences", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const p = json?.preference;
          if (p) {
            setFrequency(p.frequency);
            setTopics(p.topics ?? "");
            setPaused(Boolean(p.paused));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const parsed = Array.from(
      new Set(
        String(topics || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    );
    setEffectiveTopics(parsed);
  }, [topics]);

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency, topics, paused }),
      });
      if (!res.ok) throw new Error("Could not save preferences.");

      const json = await res.json();
      setNotice({
        type: "success",
        message: paused
          ? "Preferences saved. Subscription is paused."
          : json.enqueued
          ? "Preferences saved. We’ll generate your newsletter shortly."
          : "Preferences saved, but couldn’t enqueue the newsletter (check Inngest keys/config).",
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function togglePause(next) {
    setPausing(true);
    setNotice(null);
    const prev = paused;
    setPaused(next);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next }),
      });
      if (!res.ok) throw new Error("Could not update pause status.");
      setNotice({
        type: "success",
        message: next
          ? "Paused — you won't receive newsletters."
          : "Resumed — newsletters are active again.",
      });
    } catch (err) {
      setPaused(prev);
      setNotice({
        type: "error",
        message: err?.message || "Something went wrong.",
      });
    } finally {
      setPausing(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background to-muted/40 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-4xl border border-border/60 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs md:text-sm rounded-full border px-3 py-1 bg-muted">
            <Sparkles className="h-4 w-4" />
            AI Newsletter
          </div>
          <CardTitle className="text-2xl md:text-3xl tracking-tight">
            Your Newsletter
          </CardTitle>
          <CardDescription>
            Pick how often you want summaries and (optionally) the topics you
            care about.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && (
            <div
              className={[
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                "md:whitespace-nowrap",
                notice.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800/40"
                  : "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-800/40",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              {notice.type === "success" ? (
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                  />
                  <path strokeWidth="2" d="m22 4-10 11-3-3" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeWidth="2" d="M12 8v4m0 4h.01" />
                </svg>
              )}
              <p className="leading-none truncate max-w-[70ch]">
                {notice.message}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <PauseCircle className="h-4 w-4" />
                  <div className="space-y-0.5">
                    <Label htmlFor="paused" className="leading-none">
                      Pause Subscription
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {paused ? "Paused - no emails will be sent." : "Active"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="paused"
                  checked={paused}
                  onCheckedChange={togglePause}
                  disabled={loading || saving || pausing}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {FREQUENCIES.map((f) => {
                    const active = f.value === frequency;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        disabled={loading || saving}
                        onClick={() => setFrequency(f.value)}
                        className={[
                          "rounded-full px-4 py-2 text-sm font-medium transition border",
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Biweekly = every 2 weeks.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>
                Topics{" "}
                <span className="text-xs text-muted-foreground">
                  (comma separated, optional)
                </span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="ai, genai, ml"
                  disabled={loading || saving}
                  className="pl-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  effectiveTopics:
                </Label>
                {effectiveTopics.length > 0 ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {effectiveTopics.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border bg-muted/60 px-3 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    (none - server may fallback)
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {paused
              ? "Paused - you can still change topics/frequency."
              : "You can update these anytime."}
          </p>
          <Button onClick={save} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save preferences"
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

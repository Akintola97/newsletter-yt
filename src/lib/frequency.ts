// src/lib/frequency.ts
export type Frequency = "DAILY" | "BIWEEKLY" | "MONTHLY";

export function nextSendAtFrom(f: Frequency, from: Date = new Date()): Date {
  const d = new Date(from);
  if (f === "DAILY") d.setDate(d.getDate() + 1);
  else if (f === "BIWEEKLY") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  // normalize sending hour if you want (e.g., 14:00 local)
  d.setHours(14, 0, 0, 0);
  return d;
}

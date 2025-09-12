// lib/topics.js
export function topicsToCategories(input) {
  if (!input) return [];
  return Array.from(
    new Set(
      String(input)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

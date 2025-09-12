// src/lib/newsletter-html.ts
export function buildNewsletterHtml({
  title,
  body,
}: {
  title: string;
  body: string; // plain text or lightly formatted from AI
}) {
  // convert simple line breaks to <br> and basic sections
  const safeBody = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; }
      .wrap { max-width: 680px; margin: 0 auto; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
      .muted { color: #64748b; font-size: 12px; margin-top: 16px; }
      a { color: #3b82f6; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${title}</h1>
      <div class="card">
        <div>${safeBody}</div>
      </div>
      <p class="muted">You’re receiving this because you subscribed to AI Newsletter. Manage topics/frequency in your dashboard.</p>
    </div>
  </body>
</html>`;
}

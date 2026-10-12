// Parahouse Worker
// Static files in /public are served by Cloudflare directly (free, no Worker run).
// This code only runs for /api/* (see run_worker_first in wrangler.jsonc).

const MAX = { name: 120, email: 200, company: 160, event_type: 80, event_date: 80, message: 5000 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ error: "Use POST to send a brief." }, 405, { Allow: "POST" });
      }
      return handleContact(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    // Anything else falls through to the static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  const wantsJson = (request.headers.get("Accept") || "").includes("application/json");

  let data;
  try {
    data = await readBody(request);
  } catch {
    return reply(wantsJson, request, 400, "We couldn't read that form. Refresh the page and try again.");
  }

  // Honeypot: real visitors never see or fill the "website" field.
  if (data.website) return reply(wantsJson, request, 200);

  const fields = {};
  for (const [key, limit] of Object.entries(MAX)) {
    fields[key] = String(data[key] ?? "").trim().slice(0, limit);
  }

  if (!fields.name || !fields.email || !fields.message) {
    return reply(wantsJson, request, 400, "Add your name, email and a few lines about the event.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return reply(wantsJson, request, 400, "That email address doesn't look right. Check it and send again.");
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return reply(
      wantsJson,
      request,
      503,
      "The form isn't switched on yet. Please try again later."
    );
  }

  const text = [
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Company: ${fields.company || "-"}`,
    `Event type: ${fields.event_type || "-"}`,
    `Event date: ${fields.event_date || "-"}`,
    "",
    fields.message,
  ].join("\n");

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: fields.email,
      subject: `New brief from ${fields.name}${fields.company ? ` (${fields.company})` : ""}`,
      text,
    }),
  });

  if (!send.ok) {
    console.error("Resend error", send.status, await send.text());
    return reply(wantsJson, request, 502, "The brief didn't send. Please try again in a moment.");
  }

  return reply(wantsJson, request, 200);
}

async function readBody(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/json")) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form);
}

// JSON for the fetch() path; a redirect back to the page for no-JS form posts.
function reply(wantsJson, request, status, error) {
  if (wantsJson) return json(status === 200 ? { ok: true } : { error }, status);
  const back = new URL("/contact/", request.url);
  if (status === 200) back.searchParams.set("sent", "1");
  else back.searchParams.set("error", "1");
  return Response.redirect(back.toString(), 303);
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

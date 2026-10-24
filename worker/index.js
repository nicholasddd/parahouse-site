// Parahouse Worker
// Static files in /public are served by Cloudflare directly (free, no Worker run).
// This code only runs for /api/* and /assets/video/* (see run_worker_first in wrangler.jsonc).

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

    if (url.pathname.startsWith("/assets/video/")) return serveVideo(request, env);

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

  if (!env.EMAIL || !env.CONTACT_TO || !env.CONTACT_FROM) {
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

  // Cloudflare Email Service: the EMAIL binding may only send to the verified Email Routing
  // destination listed in wrangler.jsonc, which is free and needs no API key.
  try {
    await env.EMAIL.send({
      from: { email: env.CONTACT_FROM, name: "parahouse website" },
      to: env.CONTACT_TO.split(",").map((s) => s.trim()).filter(Boolean),
      replyTo: { email: fields.email, name: fields.name },
      subject: `New brief from ${fields.name}${fields.company ? ` (${fields.company})` : ""}`,
      text,
    });
  } catch (error) {
    console.error("Email send failed", error.code, error.message);
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


// Project clips with byte ranges: Safari (and every iPhone) asks for a video in ranges and won't play it
// without a 206 answer, which static assets don't give. The clips are a few MB, so slicing in memory is fine.
async function serveVideo(request, env) {
  const asset = await env.ASSETS.fetch(new Request(new URL(request.url).origin + new URL(request.url).pathname, { method: "GET" }));
  if (!asset.ok) return asset;
  const headers = new Headers(asset.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", "video/mp4");
  headers.set("Cache-Control", "public, max-age=86400");
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") || "");
  if (!range) return new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers });
  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  let start = range[1] === "" ? size - Number(range[2]) : Number(range[1]);
  let end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (Number.isNaN(start) || start < 0 || start >= size || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : body.slice(start, end + 1), { status: 206, headers });
}

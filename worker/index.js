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

    // Live visitor count. Each open tab pings every 30s (no cookies, no IP or personal data kept);
    // /api/live shows how many tabs pinged in the last minute, to whoever has the private key.
    if (url.pathname === "/api/ping" && request.method === "POST") {
      const body = await request.text().catch(() => "");
      env.PRESENCE.get(env.PRESENCE.idFromName("site")).fetch("https://presence/ping", { method: "POST", body }).catch(() => {});
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/live") return handleLive(url, env);

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

// ---------- Live visitor count ----------
async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handleLive(url, env) {
  const key = url.searchParams.get("k") || "";
  if (!env.LIVE_KEY_HASH || !key || (await sha256(key)) !== env.LIVE_KEY_HASH) {
    return new Response("Not found.", { status: 404 });
  }
  const stub = env.PRESENCE.get(env.PRESENCE.idFromName("site"));
  if (url.searchParams.has("json")) {
    const res = await stub.fetch("https://presence/count");
    return new Response(res.body, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  return new Response(LIVE_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

const LIVE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Live visitors · parahouse</title>
<style>
body{margin:0;min-height:100svh;display:grid;place-items:center;background:#0b0705;color:#f3ead8;font:16px/1.5 system-ui,sans-serif}
main{text-align:center;padding:24px}
.n{font-size:clamp(96px,30vw,220px);font-weight:800;line-height:1;color:#ff5a0f;font-variant-numeric:tabular-nums}
.l{opacity:.7;margin-top:8px}
ul{list-style:none;padding:0;margin:28px 0 0;opacity:.8;font-size:14px}
li{padding:4px 0}
.t{opacity:.45;font-size:12px;margin-top:24px}
</style></head><body><main>
<div class="n" id="n">–</div><div class="l" id="l">on parahouse.co right now</div>
<ul id="pages"></ul><div class="t" id="t"></div>
</main><script>
const n=document.getElementById("n"),l=document.getElementById("l"),pages=document.getElementById("pages"),t=document.getElementById("t");
async function tick(){
  try{
    const r=await fetch(location.pathname+location.search+"&json",{cache:"no-store"});const d=await r.json();
    n.textContent=d.count;l.textContent=(d.count===1?"person":"people")+" on parahouse.co right now";
    pages.innerHTML="";Object.entries(d.pages).sort((a,b)=>b[1]-a[1]).forEach(([p,c])=>{const li=document.createElement("li");li.textContent=c+" × "+p;pages.append(li);});
    t.textContent="Updated "+new Date().toLocaleTimeString();
  }catch(e){t.textContent="Couldn't update, retrying…";}
}
tick();setInterval(tick,5000);
<\/script></body></html>`;

// One instance for the whole site: open tabs by a random per-tab id, with the page they're on and when they
// last pinged. Memory only; if Cloudflare restarts it, the count rebuilds within 30 seconds.
export class Presence {
  constructor() { this.tabs = new Map(); }
  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    if (url.pathname === "/ping") {
      let d = {};
      try { d = JSON.parse(await request.text()); } catch {}
      const id = String(d.id || "").slice(0, 40);
      if (!id) return new Response(null, { status: 204 });
      if (d.leave) this.tabs.delete(id);
      else this.tabs.set(id, { path: String(d.path || "/").slice(0, 120), at: now });
      if (this.tabs.size > 5000) this.prune(now);
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/count") {
      this.prune(now);
      const pages = {};
      for (const { path } of this.tabs.values()) pages[path] = (pages[path] || 0) + 1;
      return Response.json({ count: this.tabs.size, pages });
    }
    return new Response("Not found.", { status: 404 });
  }
  prune(now) { for (const [id, v] of this.tabs) if (now - v.at > 65000) this.tabs.delete(id); }
}

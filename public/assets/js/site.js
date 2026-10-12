// Parahouse — small progressive enhancements. Every page still works without this file.
const root = document.documentElement;
root.classList.add("js");

const storage = { // per-visitor conveniences only
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

// ---------- Top links collapse into the Menu pill once the visitor scrolls ----------
let scrollTicking = false;
const updateScrolled = () => { root.classList.toggle("is-scrolled", window.scrollY > 120); scrollTicking = false; };
window.addEventListener("scroll", () => { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateScrolled); } }, { passive: true });
updateScrolled();

// ---------- Menu panel ----------
const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById("menu");
if (menuButton && menu) {
  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector("[data-menu-label]").textContent = open ? "Close" : "Menu";
    if (open) menu.querySelector("a")?.focus({ preventScroll: true });
  };
  menuButton.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setOpen(false);
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menu.classList.contains("open") && !menu.contains(event.target) && !menuButton.contains(event.target)) setOpen(false);
  });
}

// ---------- Studio time (Singapore) ----------
const clockFormat = new Intl.DateTimeFormat("en-SG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Singapore" });
const clocks = document.querySelectorAll("[data-clock]");
if (clocks.length) {
  const tick = () => { const now = clockFormat.format(new Date()); clocks.forEach((el) => (el.textContent = now)); };
  tick();
  setInterval(tick, 1000);
}

// ---------- Reveal on scroll (home portfolio) ----------
const reveals = document.querySelectorAll(".reveal");
if (reveals.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// ---------- Footer year ----------
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- Home showcase: slow crossfade between project images ----------
const showcase = document.querySelector("[data-showcase]");
if (showcase && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const images = showcase.querySelectorAll("[data-showcase-media] img");
  let current = 0;
  if (images.length > 1) {
    setInterval(() => {
      if (document.hidden) return;
      images[current].classList.remove("active");
      current = (current + 1) % images.length;
      images[current].classList.add("active");
    }, 6000);
  }
}

// ---------- Work page: search, type and work filters ----------
const workFilters = document.querySelector("[data-work-filters]");
if (workFilters) {
  const cards = [...document.querySelectorAll(".work-card")];
  const empty = document.querySelector("[data-work-empty]");
  const search = workFilters.querySelector("[data-filter-search]");
  const state = { type: "all", service: "all", q: "" };
  const apply = () => {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const ok = (state.type === "all" || card.dataset.type === state.type)
        && (state.service === "all" || card.dataset.services.split(" ").includes(state.service))
        && words.every((w) => card.dataset.search.includes(w));
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    empty.hidden = shown > 0;
  };
  const press = (attr, value) => {
    workFilters.querySelectorAll(`[${attr}]`).forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute(attr) === value)));
  };
  workFilters.addEventListener("click", (event) => {
    const t = event.target.closest("[data-filter-type]");
    const sv = event.target.closest("[data-filter-service]");
    if (t) { state.type = t.dataset.filterType; press("data-filter-type", state.type); apply(); }
    if (sv) { state.service = sv.dataset.filterService; press("data-filter-service", state.service); apply(); }
  });
  search.addEventListener("input", () => { state.q = search.value; apply(); });
  document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    Object.assign(state, { type: "all", service: "all", q: "" });
    search.value = "";
    press("data-filter-type", "all");
    press("data-filter-service", "all");
    apply();
  });
}

// ---------- Text scramble (after GSAP's ScrambleText, as on fabric.codebydennis.com) ----------
// Letters turn into random characters and settle back into the text from left to right.
const SCRAMBLE_CHARS = "XYZxyzabc0$€£";
const scramble = (el, text, duration = 600) => {
  if (reduceMotionNow()) { el.textContent = text; return; }
  cancelAnimationFrame(el._scramble || 0);
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const settled = Math.floor(t * text.length);
    let out = text.slice(0, settled);
    for (let i = settled; i < text.length; i++) {
      out += text[i] === " " ? " " : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    if (t < 1) el._scramble = requestAnimationFrame(frame);
  };
  el._scramble = requestAnimationFrame(frame);
};
function reduceMotionNow() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

// Project cards: name and title scramble on the way in and again on the way out.
document.querySelectorAll("[data-hover-scramble]").forEach((card) => {
  const targets = [...card.querySelectorAll("[data-scramble]")];
  targets.forEach((el) => (el.dataset.text = el.textContent));
  const run = () => targets.forEach((el) => scramble(el, el.dataset.text));
  card.addEventListener("mouseenter", run);
  card.addEventListener("mouseleave", run);
});

// Section headings scramble in once as they scroll into view.
const scrollScramble = document.querySelectorAll("[data-scroll-scramble]");
if (scrollScramble.length && "IntersectionObserver" in window) {
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      seen.unobserve(entry.target);
      scramble(entry.target, entry.target.textContent, 900);
    });
  }, { rootMargin: "0px 0px -15% 0px" });
  scrollScramble.forEach((el) => seen.observe(el));
}

// A small pill follows the cursor over project cards, showing the project's name.
const cursorTargets = document.querySelectorAll("[data-cursor-text]");
if (cursorTargets.length && matchMedia("(hover: hover)").matches) {
  const bubble = document.createElement("div");
  bubble.className = "cursor-bubble";
  bubble.setAttribute("aria-hidden", "true");
  bubble.innerHTML = '<span></span><svg viewBox="0 0 24 24" fill="none"><polyline points="9 5 16 12 9 19"/></svg>';
  document.body.append(bubble);
  const label = bubble.querySelector("span");
  let x = 0, y = 0, bx = 0, by = 0, moving = 0, flip = false;
  const follow = () => {
    bx += (x - bx) * 0.2; by += (y - by) * 0.2; // eases behind the cursor
    // Cards on the right half show the pill to the left of the cursor, so it never runs off screen.
    bubble.style.transform = flip ? `translate3d(calc(${bx - 8}px - 100%), ${by + 20}px, 0)` : `translate3d(${bx + 14}px, ${by + 20}px, 0)`;
    moving = Math.abs(x - bx) + Math.abs(y - by) > 0.3 ? requestAnimationFrame(follow) : 0;
  };
  document.addEventListener("mousemove", (event) => {
    x = event.clientX; y = event.clientY;
    if (!moving) moving = requestAnimationFrame(follow);
  }, { passive: true });
  cursorTargets.forEach((el) => {
    el.addEventListener("mouseenter", (event) => {
      const r = el.getBoundingClientRect();
      flip = r.left + r.width / 2 > innerWidth / 2;
      if (!bubble.classList.contains("is-active")) { bx = event.clientX; by = event.clientY; }
      bubble.classList.add("is-active");
      scramble(label, el.dataset.cursorText);
    });
    el.addEventListener("mouseleave", () => bubble.classList.remove("is-active"));
  });
}

// ---------- About: the parahouse difference (tabs and quarters stay in step) ----------
const pillars = document.querySelector("[data-pillars]");
if (pillars) {
  const tabs = [...pillars.querySelectorAll("[data-pillar]")];
  const quads = [...pillars.querySelectorAll("[data-quad]")];
  const panels = [...pillars.querySelectorAll('[role="tabpanel"]')];
  // Where the glow sits for each quarter: top-left, top-right, bottom-right, bottom-left of the mark.
  const wide = () => matchMedia("(min-width: 900px)").matches;
  const glow = [[18, 25], [38, 25], [38, 75], [18, 75]];
  let current = 0, timer = 0;
  const show = (i) => {
    current = i;
    tabs.forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));
    quads.forEach((q, k) => q.classList.toggle("is-active", k === i));
    panels.forEach((p, k) => (p.hidden = k !== i));
    const [gx, gy] = glow[i];
    pillars.style.setProperty("--gx", (wide() ? gx : gx + 22) + "%");
    pillars.style.setProperty("--gy", (wide() ? gy : gy * 0.5) + "%");
  };
  const stop = () => { clearInterval(timer); timer = 0; };
  tabs.forEach((t, i) => t.addEventListener("click", () => { stop(); show(i); }));
  quads.forEach((q, i) => q.addEventListener("click", () => { stop(); show(i); }));
  pillars.querySelector('[role="tablist"]').addEventListener("keydown", (event) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    stop(); show((current + step + tabs.length) % tabs.length); tabs[current].focus();
  });
  show(0);
  if (reduceMotionNow()) {
    pillars.querySelectorAll("animateTransform").forEach((a) => a.remove());
  } else {
    timer = setInterval(() => { if (!document.hidden) show((current + 1) % tabs.length); }, 5000); // cycles until the visitor picks one
  }
}

// ---------- FAQ: answers slide open and closed instead of snapping ----------
// The <details> stays the source of truth (works without JS); script only animates its height.
document.querySelectorAll("details.faq-item").forEach((item) => {
  const summary = item.querySelector("summary");
  const body = item.querySelector(".service-body");
  let anim = null;
  const run = (from, to, open) => {
    anim?.cancel();
    item.style.overflow = "hidden";
    anim = item.animate({ height: [from + "px", to + "px"] }, { duration: reduceMotionNow() ? 0 : 450, easing: "cubic-bezier(.65,0,.2,1)" });
    if (open) body.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: reduceMotionNow() ? 0 : 400, delay: 80, easing: "ease-out", fill: "backwards" });
    anim.onfinish = () => { anim = null; item.style.height = item.style.overflow = ""; if (!open) item.open = false; };
  };
  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const start = item.offsetHeight; // starts from wherever it is, so a quick second click reverses smoothly
    if (item.classList.toggle("is-open")) {
      // Only one answer open at a time: the previous one slides shut as this one opens.
      item.parentElement.querySelectorAll("details.faq-item.is-open").forEach((other) => other !== item && other._close());
      item.open = true;
      run(start, item.scrollHeight, true);
    } else {
      run(start, summary.offsetHeight, false);
    }
  });
  item._close = () => {
    item.classList.remove("is-open");
    run(item.offsetHeight, summary.offsetHeight, false);
  };
});

// ---------- A small dot that trails the cursor ----------
if (matchMedia("(hover: hover)").matches) {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.append(dot);
  let tx = 0, ty = 0, dx = 0, dy = 0, running = 0;
  const ease = reduceMotionNow() ? 1 : 0.14; // lags behind the pointer; no lag with reduced motion
  const step = () => {
    dx += (tx - dx) * ease; dy += (ty - dy) * ease;
    // Sits just above and to the right of the pointer, never on it (the cursor pill sits below).
    dot.style.transform = `translate3d(${dx + 16}px, ${dy - 14}px, 0)`;
    running = Math.abs(tx - dx) + Math.abs(ty - dy) > 0.2 ? requestAnimationFrame(step) : 0;
  };
  document.addEventListener("mousemove", (event) => {
    if (!dot.classList.contains("is-visible")) { dx = event.clientX; dy = event.clientY; }
    tx = event.clientX; ty = event.clientY;
    dot.classList.add("is-visible");
    if (!running) running = requestAnimationFrame(step);
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => dot.classList.remove("is-visible"));
}

// ---------- Intro greeting and page-change curtain ----------
// First visit in a session: the <head> script shows "• Hello" on the curtain; here we cycle it
// through greetings before the CSS lifts it. Internal links: a curtain rises with the page
// name, then the browser navigates; the next page opens with the same curtain and lifts it.
if (root.classList.contains("is-intro")) {
  const words = ["Hello", "你好", "Halo", "வணக்கம்", "こんにちは", "안녕하세요", "Bonjour", "Hola", "Ciao", "Hello"];
  let i = 0;
  setTimeout(function step() {
    i += 1;
    if (i >= words.length) return;
    root.dataset.curtain = words[i];
    setTimeout(step, 125);
  }, 520);
}
["is-intro", "is-entering"].forEach((cls) => {
  if (root.classList.contains(cls)) setTimeout(() => root.classList.remove(cls), cls === "is-intro" ? 3200 : 1400);
});

const PAGE_NAMES = { "/": "Home", "/portfolio/": "Work", "/services/": "Services", "/about/": "About", "/contact/": "Contact" };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.addEventListener("click", (event) => {
  if (reduceMotion || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link || link.target || link.hasAttribute("download")) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
  if (url.pathname === location.pathname) return;
  if (/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith(".html")) return;
  event.preventDefault();
  const label = link.dataset.label || PAGE_NAMES[url.pathname] || link.textContent.trim().split("\n")[0] || "parahouse";
  try { sessionStorage.setItem("ph-curtain", label); } catch {}
  const curtain = document.createElement("div");
  curtain.className = "curtain-leave";
  // Heading to a project page: the curtain takes that project's colour, matching the page it reveals.
  const tintTo = (window.PH_CURTAINS || {})[url.pathname];
  if (tintTo) curtain.style.background = tintTo;
  curtain.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = "\u2022\u2002" + label;
  curtain.append(text);
  document.body.append(curtain);
  // Navigate the moment the curtain has fully risen (the page is usually prefetched by then).
  let gone = false;
  const go = () => { if (!gone) { gone = true; location.href = url.href; } };
  curtain.addEventListener("animationend", (e) => { if (e.target === curtain) go(); });
  setTimeout(go, 750);
});
// Back/forward from the browser cache: clear any curtain left from leaving.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) document.querySelectorAll(".curtain-leave").forEach((el) => el.remove());
});

// ---------- Work page heading: the word glitches into the next one every few seconds ----------
const glitch = document.querySelector("[data-glitch]");
if (glitch && !reduceMotion) {
  const words = glitch.dataset.glitch.split("|");
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>-_";
  let index = 0;
  const morph = (to) => {
    const from = glitch.textContent;
    const length = Math.max(from.length, to.length);
    const start = performance.now();
    const duration = 650;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      let out = "";
      for (let i = 0; i < length; i++) {
        const settle = (i / length) * 0.7 + 0.3; // letters lock in from left to right
        if (t >= settle) out += to[i] || "";
        else if (t >= settle - 0.35) out += to[i] || from[i] ? glyphs[(Math.random() * glyphs.length) | 0] : "";
        else out += from[i] || "";
      }
      glitch.textContent = out;
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  setInterval(() => {
    if (document.hidden) return;
    index = (index + 1) % words.length;
    morph(words[index]);
  }, 3600);
}

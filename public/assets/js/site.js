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

// ---------- Home hero: vertical panels that turn as the mouse runs across them (desktop only) ----------
// The hero is cut into thin vertical slats, each showing its own slice of the current image, with a faint
// light line between them. Moving the mouse across pushes the slats near the pointer round their vertical
// axis in the direction of travel (faster = further), and a spring swings them back. The crossfade between
// projects carries on through the slats (two faces each). Touch screens and reduced motion keep the plain image.
if (showcase && matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotionNow()) {
  const media = showcase.querySelector("[data-showcase-media]");
  const imgs = [...media.querySelectorAll("img")];
  const layer = document.createElement("div");
  layer.className = "slats";
  layer.setAttribute("aria-hidden", "true");
  media.append(layer);
  showcase.classList.add("has-slats");
  const SLAT = 64; // target slat width in px
  let slats = [], W = 0, H = 0, front = 0, frame = 0, lastX = null;
  const active = () => imgs.find((i) => i.classList.contains("active")) || imgs[0];
  const paint = (face, img, left) => {
    const iw = img.naturalWidth || +img.getAttribute("width"), ih = img.naturalHeight || +img.getAttribute("height");
    const k = Math.max(W / iw, H / ih), w = iw * k, h = ih * k; // object-fit: cover
    face.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    face.style.backgroundSize = `${w}px ${h}px`;
    face.style.backgroundPosition = `${(W - w) / 2 - left}px ${(H - h) / 2}px`;
  };
  const build = () => {
    W = showcase.clientWidth; H = showcase.clientHeight;
    const n = Math.max(8, Math.round(W / SLAT)), w = W / n;
    layer.textContent = "";
    slats = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "slat";
      el.style.left = Math.floor(i * w) + "px";
      el.style.width = Math.ceil(w) + 1 + "px"; // 1px overlap: no seams at rest
      const faces = [document.createElement("div"), document.createElement("div")];
      faces.forEach((fc) => { fc.className = "slat-face"; el.append(fc); });
      paint(faces[front], active(), i * w);
      faces[front].classList.add("is-on");
      layer.append(el);
      slats.push({ el, faces, left: i * w, w, a: 0, v: 0 });
    }
  };
  // Crossfade: when the showcase moves to the next image, every slat fades its other face in with it.
  const swap = (img) => {
    const next = 1 - front;
    slats.forEach((sl) => { paint(sl.faces[next], img, sl.left); sl.faces[next].classList.add("is-on"); sl.faces[front].classList.remove("is-on"); });
    front = next;
  };
  new MutationObserver((list) => list.forEach((m) => { if (m.target.classList.contains("active")) swap(m.target); }))
    .observe(media, { attributes: true, attributeFilter: ["class"], subtree: true });
  const tick = () => {
    let moving = false;
    slats.forEach((sl) => {
      sl.v += -0.055 * sl.a; // spring back to flat
      sl.v *= 0.9;          // damping
      sl.a = Math.max(-65, Math.min(65, sl.a + sl.v));
      if (Math.abs(sl.a) > 0.05 || Math.abs(sl.v) > 0.05) moving = true; else { sl.a = 0; sl.v = 0; }
      sl.el.style.transform = sl.a ? `rotateY(${sl.a.toFixed(2)}deg)` : "";
      sl.el.style.setProperty("--turn", Math.abs(Math.sin((sl.a * Math.PI) / 180)).toFixed(3));
    });
    frame = moving ? requestAnimationFrame(tick) : 0;
  };
  showcase.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const x = event.clientX - showcase.getBoundingClientRect().left;
    if (lastX === null) { lastX = x; return; }
    const dx = x - lastX; lastX = x;
    slats.forEach((sl) => {
      const reach = sl.w * 1.8, d = Math.abs(sl.left + sl.w / 2 - x);
      if (d < reach) sl.v += dx * 0.3 * (1 - d / reach);
    });
    if (!frame) frame = requestAnimationFrame(tick);
  }, { passive: true });
  showcase.addEventListener("pointerleave", () => { lastX = null; });
  let resizeTimer = 0;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 150); });
  build();
}

// ---------- Work page: search and category filter ----------
const workFilters = document.querySelector("[data-work-filters]");
if (workFilters) {
  const cards = [...document.querySelectorAll(".work-card")];
  const empty = document.querySelector("[data-work-empty]");
  const search = workFilters.querySelector("[data-filter-search]");
  const state = { type: "all", q: "" };
  // A category with no projects yet (Multimedia, for now) keeps its button out of sight.
  workFilters.querySelectorAll("[data-filter-type]").forEach((b) => {
    const t = b.dataset.filterType;
    if (t !== "all" && !cards.some((card) => card.dataset.type === t)) b.closest("li").hidden = true;
  });
  const apply = () => {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const ok = (state.type === "all" || card.dataset.type === state.type) && words.every((w) => card.dataset.search.includes(w));
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    empty.hidden = shown > 0;
    dispatchEvent(new Event("ph:layout")); // the float-in re-measures the cards that moved
  };
  const press = (value) => {
    workFilters.querySelectorAll("[data-filter-type]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filterType === value)));
  };
  workFilters.addEventListener("click", (event) => {
    const t = event.target.closest("[data-filter-type]");
    if (t) { state.type = t.dataset.filterType; press(state.type); apply(); }
  });
  search.addEventListener("input", () => { state.q = search.value; apply(); });
  document.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    Object.assign(state, { type: "all", q: "" });
    search.value = "";
    press("all");
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

// Project cards: name and title scramble on the way in and again on the way out (mouse only;
// on touch screens a tap would just flicker the text before the page changes).
if (matchMedia("(hover: hover)").matches) document.querySelectorAll("[data-hover-scramble]").forEach((card) => {
  const targets = [...card.querySelectorAll("[data-scramble]")];
  targets.forEach((el) => (el.dataset.text = el.textContent));
  if (!card.hasAttribute("aria-label")) card.setAttribute("aria-label", targets.map((el) => el.dataset.text || el.textContent).join(", "));
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
  scrollScramble.forEach((el) => { el.setAttribute("aria-label", el.textContent); seen.observe(el); });
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
  let current = 0, timer = 0;
  const show = (i) => {
    current = i;
    tabs.forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));
    quads.forEach((q, k) => q.classList.toggle("is-active", k === i));
    panels.forEach((p, k) => (p.hidden = k !== i));
    // The glow sits behind whichever piece of the P is active.
    const box = pillars.getBoundingClientRect(), q = quads[i].getBoundingClientRect();
    pillars.style.setProperty("--gx", q.left - box.left + q.width / 2 + "px");
    pillars.style.setProperty("--gy", q.top - box.top + q.height / 2 + "px");
  };
  const stop = () => { clearInterval(timer); timer = 0; };
  tabs.forEach((t, i) => t.addEventListener("click", () => { stop(); show(i); }));
  quads.forEach((q, i) => q.addEventListener("click", () => { stop(); show(i); }));
  // With a mouse, hovering a tab or a piece of the P switches to it; touch screens keep tap to switch.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    [tabs, quads].forEach((list) => list.forEach((el, i) => el.addEventListener("mouseenter", () => { stop(); if (i !== current) show(i); })));
  }
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
    anim = item.animate({ height: [from + "px", to + "px"] }, { duration: reduceMotionNow() ? 0 : 300, easing: "cubic-bezier(.23,1,.32,1)" });
    if (open) body.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: reduceMotionNow() ? 0 : 250, delay: 50, easing: "cubic-bezier(.23,1,.32,1)", fill: "backwards" });
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
// It lags slightly behind the pointer and, when the pointer is still, keeps hovering around it in a
// small, slow loop (two out-of-step waves), so it never freezes. No lag and no drift with reduced motion.
if (matchMedia("(hover: hover)").matches) {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.append(dot);
  const still = reduceMotionNow();
  let tx = 0, ty = 0, dx = 0, dy = 0, frame = 0, visible = false;
  const ease = still ? 1 : 0.14;
  const step = (now) => {
    dx += (tx - dx) * ease; dy += (ty - dy) * ease;
    const t = now / 1000;
    const hx = still ? 0 : Math.sin(t * 1.3) * 3.5 + Math.sin(t * 0.55) * 2;
    const hy = still ? 0 : Math.cos(t * 1.05) * 3 + Math.sin(t * 0.8 + 1) * 1.5;
    // Sits just above and to the right of the pointer, never on it (the cursor pill sits below).
    dot.style.transform = `translate3d(${dx + 16 + hx}px, ${dy - 14 + hy}px, 0)`;
    const settling = Math.abs(tx - dx) + Math.abs(ty - dy) > 0.2;
    frame = visible && !document.hidden && (settling || !still) ? requestAnimationFrame(step) : 0;
  };
  const wake = () => { if (!frame) frame = requestAnimationFrame(step); };
  document.addEventListener("mousemove", (event) => {
    if (!visible) { dx = event.clientX; dy = event.clientY; }
    tx = event.clientX; ty = event.clientY;
    visible = true;
    dot.classList.add("is-visible");
    wake();
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { visible = false; dot.classList.remove("is-visible"); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) wake(); });
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
    setTimeout(step, 80);
  }, 300);
}
["is-intro", "is-entering"].forEach((cls) => {
  if (root.classList.contains(cls)) setTimeout(() => root.classList.remove(cls), cls === "is-intro" ? 2100 : 800);
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
  // The curtain always takes the colour of the page it reveals: a project's own colour, or the
  // the deep ember gradient (the default --curtain) for every other page, even when leaving a coloured project page.
  curtain.style.background = (window.PH_CURTAINS || {})[url.pathname] || "linear-gradient(180deg, #1c0603 0%, #7a1c08 100%)";
  curtain.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = "\u2022\u2002" + label;
  curtain.append(text);
  document.body.append(curtain);
  // Navigate the moment the curtain has fully risen (the page is usually prefetched by then).
  let gone = false;
  const go = () => { if (!gone) { gone = true; location.href = url.href; } };
  curtain.addEventListener("animationend", (e) => { if (e.target === curtain) go(); });
  setTimeout(go, 450);
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

// ---------- Contact: the Pitch Kit's "Send brief" arrives with ?type=pitch ----------
const eventType = document.getElementById("event_type");
if (eventType && new URLSearchParams(location.search).get("type") === "pitch") eventType.value = "Pitch support";

// ---------- Project images: lusion.co's featured-work entry and scroll curve ----------
// Lusion draws its project images in WebGL. Two parts of it are rebuilt here, with the same numbers:
//  1. Entry, timed when an image comes on screen (and replayed when it comes back): its visible area opens
//     from 70% to 100% with the rounded corners kept, and the picture settles from a 1 / 0.75 zoom
//     (expo-out over 1.5s). Home's black cards get the same opening.
//  2. Scroll curve, from Lusion's fragment shader:
//       baseUv.x -= (screenUv.x - 0.5) * (1. - sin(screenUv.y * PI)) * rippleStrength;
//       rippleStrength = min(0.15, easedScrollStrength * 0.5)
//     While the page scrolls, every row of an image is stretched sideways about the middle of the screen,
//     most at the top and bottom of the screen and not at all in the middle, so an image coming up from below
//     bends like a page over a cylinder, then eases flat when scrolling stops. A transform can't bend rows
//     differently, so each image is drawn row by row onto its own canvas, which scrolls with the page.
// The <img> stays in place (hidden) for layout, alt text and as the fallback if the canvas can't draw.
const floatCards = [...document.querySelectorAll(".pcard, .work-card, .media.mosaic figure")];
if (!floatCards.length || reduceMotionNow()) document.documentElement.classList.add("float-ready");
else {
  const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const PAD = 0.1; // the canvas reaches 10% past each side so stretched rows aren't cut off
  const items = floatCards.map((el) => {
    const mask = el.querySelector(".work-media") || el;
    const img = el.matches(".pcard") ? null : mask.querySelector("img"); // Home's cards are black at rest: no picture to draw
    return { el, mask, img, start: 0, on: false, hover: 0, hoverTo: 0, canvas: null, ctx: null, ready: false, w: 0, h: 0 };
  });

  // Canvas for each image, made once its picture has decoded. Until then the <img> shows as usual.
  const dpr = () => Math.min(2, devicePixelRatio || 1);
  const setup = (it) => {
    if (!it.img) return;
    const go = () => {
      const canvas = document.createElement("canvas");
      canvas.className = "curve-canvas";
      canvas.setAttribute("aria-hidden", "true");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      it.canvas = canvas; it.ctx = ctx;
      it.mask.append(canvas);
      it.mask.classList.add("has-curve");
      it.ready = true; size(it); it.dirty = true; it.settled = false; wake();
    };
    if (it.img.complete && it.img.naturalWidth) go();
    else it.img.addEventListener("load", go, { once: true });
    const enter = () => { it.hoverTo = 1; wake(); }, leave = () => { it.hoverTo = 0; wake(); };
    it.el.addEventListener("mouseenter", enter); it.el.addEventListener("mouseleave", leave);
  };
  const size = (it) => {
    if (!it.canvas) return;
    it.w = it.mask.clientWidth; it.h = it.mask.clientHeight;
    const d = dpr();
    it.canvas.width = Math.round(it.w * (1 + 2 * PAD) * d);
    it.canvas.height = Math.round(it.h * d);
  };

  // One image, drawn for reveal ratio b, scroll curve k and hover zoom.
  const draw = (it, b, k, rect) => {
    const { ctx, img, w: W, h: H } = it, d = dpr(), P = W * PAD;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, W + 2 * P, H);
    if (b <= 0 || !W || !H) return;
    const radius = parseFloat(getComputedStyle(it.mask).borderTopLeftRadius) || 0;
    const s = 0.7 + 0.3 * b; // visible area
    const zoom = (1 / (0.75 + 0.25 * b)) * (1 + 0.03 * it.hover); // the picture inside, plus the hover zoom
    const iw = img.naturalWidth, ih = img.naturalHeight, cover = Math.max(W / iw, H / ih) * zoom;
    const x0 = (W * (1 - s)) / 2, y0 = (H * (1 - s)) / 2, bw = W * s, bh = H * s, R = Math.min(radius, bw / 2, bh / 2);
    const srcX = (X) => ((X - W / 2) / cover) + iw / 2, srcY = (Y) => ((Y - H / 2) / cover) + ih / 2;
    const S = innerWidth, vh = innerHeight, cx = S / 2 - rect.left; // the middle of the screen, in the image's own px
    if (k < 0.0005) { // flat: one rounded image
      ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(P + x0, y0, bw, bh, R) : ctx.rect(P + x0, y0, bw, bh); ctx.clip();
      ctx.drawImage(img, srcX(x0), srcY(y0), bw / cover, bh / cover, P + x0, y0, bw, bh);
      ctx.restore(); return;
    }
    const ROW = 2;
    for (let y = y0; y < y0 + bh; y += ROW) {
      const rh = Math.min(ROW, y0 + bh - y), mid = y + rh / 2;
      // rounded corners: how far in this row starts and ends
      const fromTop = mid - y0, fromBottom = y0 + bh - mid;
      const e = fromTop < R ? R - Math.sqrt(R * R - (R - fromTop) ** 2) : fromBottom < R ? R - Math.sqrt(R * R - (R - fromBottom) ** 2) : 0;
      const a = x0 + e, z = x0 + bw - e;
      // Lusion's curve for this row: stretch about the middle of the screen by 1 / (1 - g * W / S)
      const sy = Math.min(1, Math.max(0, 1 - (rect.top + mid) / vh));
      const g = (1 - Math.sin(sy * Math.PI)) * k;
      const m = 1 / (1 - (g * W) / S);
      const da = P + cx + (a - cx) * m, dz = P + cx + (z - cx) * m;
      ctx.drawImage(img, srcX(a), srcY(y), (z - a) / cover, rh / cover, da, y, dz - da, rh + 0.5);
    }
  };

  // Scroll strength, as Lusion's scroll manager: add the distance moved (in screen heights), ease back to 0.
  let eased = 0, lastY = scrollY, lastT = performance.now(), frame = 0, timer = 0, curveWas = 0, opening = true;
  // While the page is still opening (until just after load, including a restored scroll position), cards that are
  // on screen count as already there.
  const opened = () => setTimeout(() => (opening = false), 300);
  if (document.readyState === "complete") opened(); else addEventListener("load", opened, { once: true });
  setTimeout(() => (opening = false), 2500); // never longer than this, even if an image is slow
  const tick = () => {
    cancelAnimationFrame(frame); clearTimeout(timer); frame = timer = 0;
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    eased += Math.abs(scrollY - lastY) / innerHeight; lastY = scrollY;
    eased += (0 - eased) * (1 - Math.exp(-10 * dt));
    eased = Math.min(eased, 1);
    const k = Math.min(0.15, eased * 0.5);
    const curving = k >= 0.0005, settle = !curving && curveWas; // one last flat frame when the curve ends
    curveWas = curving;
    const vh = innerHeight; let busy = curving;
    items.forEach((it) => {
      const rect = it.mask.getBoundingClientRect();
      const visible = rect.height > 0 && rect.bottom > 0 && rect.top < vh;
      // Already on screen when the page opens: show it whole (as on Lusion, the entry plays as cards scroll in)
      if (visible && !it.on) { it.on = true; it.settled = false; it.start = opening ? now - 1500 : now; }
      else if (!visible && it.on) { it.on = false; it.settled = false; it.dirty = true; }
      const t = it.on ? (now - it.start) / 1000 : 0;
      const revealing = it.on && t < 1.5;
      const settling = it.on && !revealing && !it.settled; // one exact last frame at full size
      if (settling) { it.settled = true; it.dirty = true; }
      const b = it.on ? (revealing ? expoOut(t / 1.5) : 1) : 0;
      const hoverMoving = Math.abs(it.hoverTo - it.hover) > 0.001;
      if (hoverMoving) it.hover += (it.hoverTo - it.hover) * (1 - Math.exp(-dt / 0.15)); else it.hover = it.hoverTo;
      if (revealing || hoverMoving) busy = true;
      if (it.ready) {
        if (visible && (curving || settle || revealing || hoverMoving || it.dirty)) { draw(it, b, k, rect); it.dirty = false; }
        else if (!visible && it.dirty) { draw(it, 0, 0, rect); it.dirty = false; }
      } else {
        // no canvas (yet): open the element itself, as for Home's black cards
        it.mask.style.clipPath = b > 0.9995 ? "" : `inset(${(((1 - (0.7 + 0.3 * b)) / 2) * 100).toFixed(3)}% round ${getComputedStyle(it.mask).borderRadius || "0px"})`;
        if (it.img) it.img.style.scale = b > 0.9995 ? "" : (1 / (0.75 + 0.25 * b)).toFixed(4);
      }
      if (it.ready && it.mask.style.clipPath) { it.mask.style.clipPath = ""; if (it.img) it.img.style.scale = ""; }
    });
    if (busy || settle) { frame = requestAnimationFrame(tick); timer = setTimeout(tick, 120); } // the timer backs up throttled frames
  };
  const wake = () => { if (!frame && !timer) { lastT = performance.now(); frame = requestAnimationFrame(tick); timer = setTimeout(tick, 120); } };
  addEventListener("scroll", wake, { passive: true });
  let resizeTimer = 0;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { items.forEach((it) => { size(it); it.dirty = true; }); wake(); }, 100); });
  addEventListener("ph:layout", () => { items.forEach((it) => (it.dirty = true)); wake(); });
  items.forEach(setup);
  tick();
  document.documentElement.classList.add("float-ready");
}

// ---------- Footer strip: the work most related to the last project viewed ----------
// A project page remembers itself as the last project viewed (this browser only). Every footer strip
// then shows the six projects most related to it: same category first, then same client, newest
// first to break ties, never the project itself. Before any project has been viewed it stays newest first.
const STRIP_PROJECTS = [ // newest first, as on the Work page
  { slug: "cetaphil-feel-it-in-30", client: "Cetaphil", title: "Feel It in 30 Roadshow", cat: "roadshow" },
  { slug: "tsubaki-20th-anniversary", client: "TSUBAKI", title: "20th Anniversary", cat: "roadshow" },
  { slug: "ora-5-unveiling", client: "Cycle & Carriage", title: "ORA 5 Unveiling", cat: "exhibition" },
  { slug: "propw-token2049", client: "PropW", title: "TOKEN2049 Booth", cat: "exhibition" },
  { slug: "coinw-token2049-afterparty-2025", client: "CoinW", title: "2025 Afterparty", cat: "brand-events" },
  { slug: "audemars-piguet-staff-party", client: "Audemars Piguet", title: "150 Years Staff Party", cat: "brand-events" },
  { slug: "tsubaki-brand-refresh", client: "TSUBAKI", title: "Brand Refresh Activation", cat: "roadshow" },
  { slug: "lvmh-beauty-dinner-and-dance", client: "LVMH Beauty", title: "Dinner and Dance", cat: "brand-events" },
  { slug: "goodwoof-good-pet-fair", client: "Goodwoof", title: "Good Pet Fair", cat: "roadshow" },
  { slug: "coinw-token2049-afterparty-2024", client: "CoinW", title: "2024 Afterparty", cat: "brand-events" },
  { slug: "don-julio-ultima-glorifier", client: "Don Julio", title: "Ultima Glorifier", cat: "product" },
  { slug: "1664-brut-private-trade-event", client: "1664", title: "Brut Private Trade Event", cat: "brand-events" },
];
{
  const here = (location.pathname.match(/^\/portfolio\/([^/]+)\/$/) || [])[1];
  let last = here;
  try {
    if (here) localStorage.setItem("ph-last-project", here);
    else last = localStorage.getItem("ph-last-project");
  } catch {}
  const ref = STRIP_PROJECTS.find((p) => p.slug === last);
  const strip = document.querySelector(".footer-strip");
  if (strip && ref) {
    const ranked = STRIP_PROJECTS
      .map((p, i) => ({ p, i, score: (p.cat === ref.cat ? 3 : 0) + (p.client === ref.client ? 2 : 0) }))
      .filter(({ p }) => p.slug !== ref.slug)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map(({ p }) => p);
    [...strip.querySelectorAll(".strip-item")].forEach((a, k) => {
      const p = ranked[k];
      if (!p) { a.hidden = true; return; }
      a.href = `/portfolio/${p.slug}/`;
      a.dataset.label = p.client;
      const img = a.querySelector("img");
      img.src = `/assets/img/projects/${p.slug}/second.webp`;
      img.alt = `${p.client} ${p.title}`;
    });
    strip.setAttribute("aria-label", "Related projects");
  }
}

// ---------- About: "We are ___" carousel ----------
// A small vertical carousel: the current title sits in the middle of a two-line window with half of the
// previous and next titles peeking out, and every 1.4s the next one swipes up into the middle.
// Copies at both ends (last title first, first title last) make the loop seamless: after sliding onto the
// copy, the track jumps back to the real title without animating.
// Screen readers get the whole list once from the paragraph's aria-label. Reduced motion: it stays still.
const ticker = document.querySelector("[data-ticker]");
if (ticker) {
  const track = ticker.querySelector(".we-are-track");
  track.prepend(track.lastElementChild.cloneNode(true));
  track.append(track.children[1].cloneNode(true));
  const items = [...track.children];
  let i = 1;
  const place = (animate) => {
    track.classList.toggle("is-jumping", !animate); // no slide and no fade while jumping
    track.style.transform = `translateY(calc(0.55em - ${i * 1.1}em))`;
    items.forEach((el, k) => el.classList.toggle("is-current", k === i));
  };
  place(false);
  if (!reduceMotionNow()) {
    setInterval(() => {
      if (document.hidden) return;
      i += 1;
      place(true);
      if (i === items.length - 1) setTimeout(() => { i = 1; place(false); }, 520);
    }, 1400);
  }
}

// ---------- Services: offer names glitch when their card comes into focus ----------
// The same letter-by-letter glitch as the Work heading (random glyphs that lock in from left to right),
// playing once each time the mouse enters a card. Mouse only; screen readers keep the real name.
if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotionNow()) {
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>-_";
  document.querySelectorAll(".offer").forEach((card) => {
    const name = card.querySelector(".offer-name");
    if (!name) return;
    const text = name.textContent;
    name.closest(".offer-title").setAttribute("aria-label", name.closest(".offer-title").textContent.trim());
    let raf = 0;
    card.addEventListener("mouseenter", () => {
      cancelAnimationFrame(raf);
      if (!name.style.minWidth) name.style.minWidth = name.getBoundingClientRect().width + "px"; // no jiggle while letters change
      const start = performance.now(), duration = 520;
      const frame = (now) => {
        const t = Math.min(1, (now - start) / duration);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const settle = (i / text.length) * 0.7 + 0.3;
          out += text[i] === " " || t >= settle ? text[i] : glyphs[(Math.random() * glyphs.length) | 0];
        }
        name.textContent = out;
        if (t < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  });
}

// ---------- Back to work: return to the project you were on ----------
// Came from the Work page: step back in history, so its scroll and filter come back exactly.
// Otherwise (direct link, or from another page) open Work at this project's card.
document.querySelector("[data-back]")?.addEventListener("click", (event) => {
  let from = null;
  try { from = new URL(document.referrer); } catch {}
  if (from && from.origin === location.origin && from.pathname === "/portfolio/" && history.length > 1) {
    event.preventDefault();
    history.back();
  }
});
{
  const card = location.pathname === "/portfolio/" && location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (card && card.classList.contains("work-card")) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const centre = () => {
      const was = card.style.transform; card.style.transform = ""; // measure its resting box, not the float
      const box = card.getBoundingClientRect();
      card.style.transform = was;
      scrollTo({ top: scrollY + box.top - Math.max(0, (innerHeight - box.height) / 2), behavior: "instant" });
    };
    centre();
    addEventListener("load", centre, { once: true });
    card.classList.add("is-returned");
    requestAnimationFrame(() => card.classList.add("is-fading"));
    history.replaceState(null, "", location.pathname); // keep the address clean
  }
}

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

// ---------- Portfolio filters ----------
const filterBar = document.querySelector("[data-filters]");
if (filterBar) {
  const tiles = document.querySelectorAll("[data-type]");
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    const value = button.dataset.filter;
    filterBar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    tiles.forEach((tile) => (tile.hidden = value !== "all" && tile.dataset.type !== value));
    document.dispatchEvent(new Event("shelf:update"));
  });
}

// ---------- Portfolio shelf: the card under the pointer turns to face the front ----------
// The open card comes from the pointer's position across the whole shelf. The shelf's total
// width never changes (one open card plus spines), so the chosen card is always the one
// under the pointer and nothing shifts away mid-sweep.
const shelf = document.querySelector("[data-shelf]");
if (shelf) {
  const visible = () => [...shelf.querySelectorAll(".book")].filter((b) => !b.hidden);
  const open = (book) => {
    if (!book || book.classList.contains("is-open")) return;
    shelf.querySelectorAll(".book.is-open").forEach((b) => b.classList.remove("is-open"));
    book.classList.add("is-open");
  };
  const update = () => {
    const books = visible();
    shelf.style.setProperty("--n", Math.max(books.length, 1));
    if (!books.some((b) => b.classList.contains("is-open"))) open(books[0]);
  };
  shelf.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const books = visible();
    const box = shelf.getBoundingClientRect();
    const first = books[0]?.getBoundingClientRect().left ?? box.left;
    const last = books[books.length - 1]?.getBoundingClientRect().right ?? box.right;
    const x = (event.clientX - first) / Math.max(last - first, 1);
    open(books[Math.min(books.length - 1, Math.max(0, Math.floor(x * books.length)))]);
  });
  shelf.addEventListener("focusin", (event) => open(event.target.closest(".book")));
  document.addEventListener("shelf:update", update);
  update();
}

// ---------- Contact form: send with fetch so the visitor stays on the page ----------
const form = document.querySelector("[data-contact-form]");
if (form) {
  const status = form.querySelector("[data-status]");
  const submit = form.querySelector("button[type=submit]");
  const params = new URLSearchParams(location.search);
  if (params.get("sent") === "1") {
    status.dataset.state = "ok";
    status.textContent = "Brief sent. We'll reply within two working days.";
  } else if (params.get("error") === "1") {
    status.dataset.state = "error";
    status.textContent = "The brief didn't send. Check the fields and try again in a moment.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.dataset.state = "";
    status.textContent = "Sending…";
    submit.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The brief didn't send. Please try again in a moment.");
      form.reset();
      status.dataset.state = "ok";
      status.textContent = "Brief sent. We'll reply within two working days.";
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
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

const PAGE_NAMES = { "/": "Home", "/portfolio/": "Work", "/about/": "About", "/contact/": "Contact" };
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

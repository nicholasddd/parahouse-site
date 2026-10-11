// Parahouse — small progressive enhancements. Every page still works without this file.
const root = document.documentElement;
root.classList.add("js");

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

// ---------- Light / dark toggle ----------
// The saved choice is applied in each page's <head> to avoid a flash; this wires up the button.
document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  const label = () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    return dark;
  };
  label();
  button.addEventListener("click", () => {
    const next = label() ? "light" : "dark";
    root.dataset.theme = next;
    storage.set("theme", next);
    label();
  });
});

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

// ---------- Studio local time (Singapore) ----------
const clocks = document.querySelectorAll("[data-clock]");
if (clocks.length) {
  const format = new Intl.DateTimeFormat("en-SG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Singapore" });
  const tick = () => clocks.forEach((el) => (el.textContent = format.format(new Date())));
  tick();
  setInterval(tick, 1000);
}

// ---------- Footer year ----------
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- Home showcase: hover or focus a project name to switch the image ----------
const showcase = document.querySelector("[data-showcase]");
if (showcase) {
  const images = showcase.querySelectorAll("[data-showcase-media] img");
  const links = showcase.querySelectorAll("[data-showcase-list] a");
  const type = showcase.querySelector("[data-showcase-type]");
  const activate = (index) => {
    images.forEach((img, i) => img.classList.toggle("active", i === index));
    links.forEach((a, i) => a.classList.toggle("active", i === index));
    if (type) type.innerHTML = links[index].dataset.meta;
  };
  links.forEach((link, i) => {
    link.addEventListener("mouseenter", () => activate(i));
    link.addEventListener("focus", () => activate(i));
  });
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
  });
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
    status.textContent = "The brief didn't send. Check the fields and try again, or email us directly.";
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
      if (!response.ok) throw new Error(result.error || "The brief didn't send. Try again, or email us directly.");
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

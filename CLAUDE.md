# parahouse site: notes for Claude Code

Studio website for parahouse (always lowercase), a Singapore design production studio specialising in roadshows and exhibitions. It works behind the scenes for agencies: 3D models, renders, build-aligned technical drawings. Positioning: "Your silent backend. We don't compete, we enable." Tagline: "We build fast. You look good." Source of truth for copy is the 2026 capabilities deck.

## Stack
- Plain static HTML/CSS/JS in `public/`. No framework, no build step. Keep it that way unless asked.
- Hosted on Cloudflare Workers with static assets (`wrangler.jsonc`). `worker/index.js` only handles `/api/*`; everything else is a static file.
- Contact form posts to `/api/contact`, which emails via the Resend API. Secret: `RESEND_API_KEY`. Vars: `CONTACT_TO`, `CONTACT_FROM`.

## Pages
Home sections, in order: full-screen hero (logo + menu only, slow crossfade between project images), intro line, Selected work (one wide + two half `.feature` cards), Brands we've worked with (`.brand-wall`), What we do (`.service` accordion, numbered 001–004), footer.

About follows Dennis Snellenberg's about page: big headline, a plain rule, intro text (with ↘) beside a large portrait of Nicholas, "We can help you with …" in numbered columns (01–04, from the same SERVICES list as home), the parahouse difference on a `--surface` band, then the brand wall.

Footer on every page (Dennis-style): "Let's work together" (no photo), a rule with a round "Let's talk" button, email and phone pills (CTA block hidden on Contact), project thumbnail strip, large wordmark, and a meta row (version, Singapore local time, socials).

Contact is the heading, a short lede and the brief form only (no details column); briefs go to parahouse0@gmail.com (`CONTACT_TO`).

Home (`/`), Portfolio (`/portfolio/` + one folder per project), About (`/about/`), Contact (`/contact/`), `404.html`.

## Design rules (references: Zeroframe first, then Foucault)
- Dark site. Tokens (colours, radius, gaps, fonts) are at the top of `public/assets/css/site.css`; use them. Ground is a fixed, slow gradient from dark red at the top of the screen (`--bg-top`) to near-black (`--bg`) below (`body::before`); cards use `--surface`, hairlines use `--line`.
- One fixed look: no time-of-day lighting and no light/dark toggle (removed at Nicholas's request; night was too dim).
- Type: Archivo at 125% width, bold, UPPERCASE for headings (`--display`: `.statement`, intro line, tile titles, service titles, menu links, footer wordmark). Geist for body text (`--font`). Geist Mono, small uppercase with letter-spacing, for labels and metadata (`--mono`: section bars, chips, buttons, pills, form labels, footer). All self-hosted in `public/assets/fonts/`.
- Brand red `--brand` (#e5463b) is the accent: the P logo, round buttons, the current menu item, hovers.
- Logo: the red P mark (inline SVG, a traced stand-in until the original file is supplied), top-left, no text.
- Navigation (after Dennis Snellenberg): at the top of every page, Portfolio / About / Contact show as mono links top-right (`.topnav`, current page in red with a dot). After 120px of scrolling `site.js` sets `html.is-scrolled`; the links fade out and the glassy Menu pill (`.menu-toggle`) scales in, opening a compact panel (`#menu`). On phones only the Menu pill shows.
- Portfolio tiles: block-massing image (`<slug>-massing.webp`) at rest; the event photo (`<slug>-built.webp`) fades in on hover. Mono category chip, mono client, uppercase title bottom-left.
- Brand wall: client logo files supplied by Nicholas, in `public/assets/img/brands/<slug>.svg|png|webp` (names in that folder's README), laid out as an open centred field. They render as masks in muted red (`--logo`) and turn white on hover. A brand without a file shows its name as a small mono placeholder. Only use logo files Nicholas provides; never draw or trace one.
- Images sit in rounded tiles (`--radius`) with a tight 8px gap.
- Motion only answers the visitor or marks one moment: hero crossfade, menu opening, tile hover, sections fading up on scroll, and the curtain. Respect `prefers-reduced-motion` (the curtain and intro are skipped entirely).
- Curtain (after Dennis Snellenberg): first visit per browser session shows the intro: a deep red screen (`--curtain`) cycles "• Hello" through greetings, then lifts with a curved bottom edge. Internal links raise the curtain with a curved top edge and "• <page name>", then navigate; the next page opens covered and lifts. The `<head>` script sets `is-intro` / `is-entering` and `data-curtain` before paint; CSS does the lifting, `site.js` only cycles words and handles leaving. Link labels come from `data-label` (project links use the client name) or the page name.

## Copy
- Plain, specific, no hype words. Write in sentence case; CSS handles the uppercase for headings and labels.
- Calls to action: "Let’s talk" (footer) and "Send brief" (form). Contact person: Nicholas.

## Every page shares
The same `<head>` (including the inline theme script), the floating controls, the `#menu` panel and the footer (not on Home). If you change one, change all of them (`public/**/*.html`, including `404.html`).

## Adding a project
1. Copy a folder in `public/portfolio/` and rename it with a lowercase-hyphen slug.
2. Update: `<title>`, meta description, `og:` tags, `<h1>`, the four meta items (Client, Event, Type, Scope), summary, body, image paths and alt text.
3. Images go in `public/assets/img/projects/` as `<slug>-render.webp`, `<slug>-render-2.webp`, `<slug>-built.webp`, `<slug>-built-2.webp`, about 2000×1250, under 400 KB. Convert and resize if given larger files. Project pages pair the render with the build.
4. Add a `.tile` to `public/portfolio/index.html` with the right `data-type` (`exhibitions` | `roadshows`) and update the `(NN)` count.
5. Optionally add it to the home showcase: one `<img>` in `[data-showcase-media]` and one `<li>` in `[data-showcase-list]`, in the same position. The link's `data-meta` fills the top-right label.
6. Fix the `.next-pill` links so every project points to the next and the last loops to the first.

## Checks before committing
- Every page works at 390px wide with no horizontal scroll.
- All images have meaningful `alt` text and `width`/`height` attributes.
- The menu opens, closes with Escape, and the clock ticks.
- Run `npm run dev` and submit the contact form once if you touched it.

## Processing a submission
New projects arrive in `submissions/<slug>/` (outside `public/`, so never published): `project.md` (filled from `_template/project.md`), `renders/`, `photos/`.
1. Read `project.md`. If "OK to show publicly" is No, stop and ask Nicholas.
2. Pick images: the cleanest massing or render view for `<slug>-massing.webp` (tile resting state), the strongest event photo for `<slug>-built.webp` (tile hover and project page), plus one more render (`-render-2`) and one more photo (`-built-2`). Show Nicholas a contact sheet of the picks before publishing if the choice isn't obvious.
3. Resize to 2000×1250 (crop to fit), WebP, under 400 KB, into `public/assets/img/projects/`.
4. Build the project page and tile as in "Adding a project", using his wording, tightened. Add it to the home features only if he said Yes.
5. Delete the `submissions/<slug>/` folder in the same commit.

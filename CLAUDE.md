# parahouse site: notes for Claude Code

Studio website for parahouse (always lowercase), a Singapore design production studio specialising in roadshows and exhibitions. It works behind the scenes for agencies: 3D models, renders, build-aligned technical drawings. Positioning: "Your silent backend. We don't compete, we enable." Tagline: "We build fast. You look good." Source of truth for copy is the 2026 capabilities deck.

## Stack
- Plain static HTML/CSS/JS in `public/`. No framework, no build step. Keep it that way unless asked.
- Hosted on Cloudflare Workers with static assets (`wrangler.jsonc`). `worker/index.js` only handles `/api/*`; everything else is a static file.
- Contact form posts to `/api/contact`, which emails via the Resend API. Secret: `RESEND_API_KEY`. Vars: `CONTACT_TO`, `CONTACT_FROM`.

## Pages
Home sections, in order: full-screen hero (logo + menu only, slow crossfade between project images, lighting tint), intro line, Selected work (one wide + two half `.feature` cards), Brands we've worked with (`.brand-wall`, text placeholders until logo files go in `public/assets/img/brands/`), What we do (`.service` accordion, numbered 001–004), footer (contact columns, project thumbnail strip, large wordmark).

Home (`/`), Portfolio (`/portfolio/` + one folder per project), About (`/about/`), Contact (`/contact/`), `404.html`.

## Design rules (references: Zeroframe first, then Foucault)
- Dark site. Tokens (colours, radius, gaps, fonts) are at the top of `public/assets/css/site.css`; use them. Ground is near-black (`--bg`), cards use `--surface`, hairlines use `--line`.
- Lighting follows Singapore time (`data-light` = dawn | day | dusk | night on `<html>`, set in the `<head>` script and updated by `site.js`). Each phase shifts the black slightly and tints images (`--light-tint`). There is no light/dark toggle.
- Type: Archivo at 125% width, bold, UPPERCASE for headings (`--display`: `.statement`, intro line, tile titles, service titles, menu links, footer wordmark). Geist for body text (`--font`). Geist Mono, small uppercase with letter-spacing, for labels and metadata (`--mono`: section bars, chips, buttons, pills, form labels, footer). All self-hosted in `public/assets/fonts/`.
- Brand green `--brand` (#6fae80 on dark) is an accent only: the P logo, the current menu item, button hover.
- Logo: the green P mark (inline SVG, a traced stand-in until the original file is supplied), top-left, no text.
- Controls: glassy dark pills (`.pill`). Menu top-right opens a compact panel (`#menu`) with page links only.
- Portfolio tiles: block-massing image (`<slug>-massing.webp`) at rest; the event photo (`<slug>-built.webp`) fades in on hover. Mono category chip, mono client, uppercase title bottom-left.
- Brand wall: real client logo files only, in `public/assets/img/brands/<slug>.svg|png|webp` (names listed in that folder's README). They render white and dim, full on hover. A brand without a file shows its name as a small mono placeholder. Never draw or trace a client's logo.
- Images sit in rounded tiles (`--radius`) with a tight 8px gap.
- Motion only answers the visitor or marks one moment: hero crossfade, menu opening, tile hover, sections fading up on scroll. Respect `prefers-reduced-motion`.

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
- Every page works at 390px wide with no horizontal scroll, in each lighting phase.
- All images have meaningful `alt` text and `width`/`height` attributes.
- The menu opens, closes with Escape, the clock ticks, and each lighting phase reads well.
- Run `npm run dev` and submit the contact form once if you touched it.

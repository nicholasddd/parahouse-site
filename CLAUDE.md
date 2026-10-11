# parahouse site: notes for Claude Code

Studio website for parahouse (always lowercase), a Singapore design production studio specialising in roadshows and exhibitions. It works behind the scenes for agencies: 3D models, renders, build-aligned technical drawings. Positioning: "Your silent backend. We don't compete, we enable." Tagline: "We build fast. You look good." Source of truth for copy is the 2026 capabilities deck.

## Stack
- Plain static HTML/CSS/JS in `public/`. No framework, no build step. Keep it that way unless asked.
- Hosted on Cloudflare Workers with static assets (`wrangler.jsonc`). `worker/index.js` only handles `/api/*`; everything else is a static file.
- Contact form posts to `/api/contact`, which emails via the Resend API. Secret: `RESEND_API_KEY`. Vars: `CONTACT_TO`, `CONTACT_FROM`.

## Pages
Home sections, in order: full-screen hero (logo + menu only, slow crossfade between project images, lighting tint), intro line, Selected work (one wide + two half `.feature` cards), Brands we've worked with (`.brand-wall`, text placeholders until logo files go in `public/assets/img/brands/`), What we do (`.service` accordion, numbered 001–004), footer (contact columns, project thumbnail strip, large wordmark).

Home (`/`), Portfolio (`/portfolio/` + one folder per project), About (`/about/`), Contact (`/contact/`), `404.html`.

## Design rules (inspired by the Foucault Framer template)
- Image-led and minimal. Tokens (colours, radius, gaps) are at the top of `public/assets/css/site.css`; use them. Light and dark themes are both defined there; check both when changing colours.
- Brand green `--brand` (#427f53, lighter in dark mode). Buttons and active filters use it; the menu panel is deep green.
- Headings: Bricolage Grotesque (`--display`, self-hosted, width 75–100%), sentence case, solid colour, used for `.statement`, ledes, tile titles, the home project list, menu links and the footer wordmark. Keep headings moderate in size; no outlined or giant words except the footer wordmark.
- Body: Geist (`--font`, self-hosted), 13–16px.
- Lighting follows Singapore time (`data-light` = dawn | day | dusk | night on `<html>`, set in the `<head>` script and updated by `site.js`). There is no light/dark toggle.
- Logo: the green P mark (inline SVG, a traced stand-in until the original file is supplied).
- Portfolio tiles: block-massing image (`<slug>-massing.webp`) at rest; the event photo (`<slug>-built.webp`) fades in on hover. Category chip, client and title sit bottom-left.
- Controls are small pills (`.pill`): the P logo top-left, Menu top-right. The menu is a compact panel (`#menu`) that grows out of the Menu pill, with page links only.
- Images sit in rounded tiles (`--radius`) with a tight 8px gap. Text on images is white with a gradient behind it for legibility.
- About uses hairline rows with section markers (S.1, S.2…). Keep that pattern for new sections.
- Motion only answers the visitor: menu opening, showcase image crossfade on hover, tile zoom on hover. Respect `prefers-reduced-motion`.

## Copy
- Plain, specific, sentence case (except `.statement` headings, which CSS uppercases). No hype words.
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
- Every page works at 390px wide with no horizontal scroll, in light and dark.
- All images have meaningful `alt` text and `width`/`height` attributes.
- The menu opens, closes with Escape, the clock ticks, and each lighting phase reads well.
- Run `npm run dev` and submit the contact form once if you touched it.

# parahouse site: notes for Claude Code

Studio website for parahouse (always lowercase), a Singapore design studio that works for agencies (not brands) on roadshows, exhibitions and brand events: concepts, 2D and 3D design, renders, technical drawings and print-ready artwork, delivered under the agency's name. parahouse is digital only; fabrication is the agency's fabricator. Positioning: "Your silent backend. We don't compete, we enable." Tagline (deck): "We build fast. You look good." Not used on the site, since parahouse doesn't build. Source of truth for copy is the 2026 capabilities deck.

## Stack
- Plain static HTML/CSS/JS in `public/`. No framework, no build step. Keep it that way unless asked.
- Hosted on Cloudflare Workers with static assets (`wrangler.jsonc`). `worker/index.js` only handles `/api/*`; everything else is a static file.
- Contact form posts to `/api/contact`, which emails via the Resend API. Secret: `RESEND_API_KEY`. Vars: `CONTACT_TO`, `CONTACT_FROM`.

## Pages
Home sections, in order: full-screen hero (slow crossfade between project images, the key message "The creative team behind your next pitch." large bottom-left, and a mono row along the bottom: studio time, "Design studio for agencies", "Based in Singapore"), intro line (the positioning line), Selected work (one wide + two half `.feature` cards), What your agency gets (`.difference.value`, the four value points in `VALUE`), Brands we've designed for (`.brand-marquee`), How we help your team (`.service` accordion), footer.

About follows Dennis Snellenberg's about page: big headline, a plain rule, intro text (with ↘) beside a large portrait of Nicholas, "We can help your team with …" in four columns (the same SERVICES list as home), the parahouse difference on a `--surface` band, then the brand wall.

Footer on every page (Dennis-style): "Let's work together" (no photo), a rule with a round "Let's talk" button that leads to the form (CTA block hidden on Contact), project thumbnail strip, large wordmark, and a meta row (version, Singapore local time, socials).

Contact is the heading, a short lede and the brief form only (no details column); briefs go to parahouse0@gmail.com (`CONTACT_TO`).

Home (`/`), Work (`/portfolio/` + one folder per project; the menu calls it Work, the URL stays /portfolio/), About (`/about/`), Contact (`/contact/`), `404.html`. The Work page heading cycles "Collaborations", "Co-creations", "Contributions" with a short scramble every few seconds (`data-glitch`); with reduced motion it stays on the first word.

## Design rules (references: Zeroframe first, then Foucault)
- Dark site. Tokens (colours, radius, gaps, fonts) are at the top of `public/assets/css/site.css`; use them. Ground is a fixed, slow gradient from dark red at the top of the screen (`--bg-top`) to near-black (`--bg`) below (`body::before`); cards use `--surface`, hairlines use `--line`.
- One fixed look: no time-of-day lighting and no light/dark toggle (removed at Nicholas's request; night was too dim).
- Type: Archivo at 125% width, bold, UPPERCASE for headings (`--display`: `.statement`, intro line, tile titles, service titles, menu links, footer wordmark). Geist for body text (`--font`). Geist Mono, small uppercase with letter-spacing, for labels and metadata (`--mono`: section bars, chips, buttons, pills, form labels, footer). All self-hosted in `public/assets/fonts/`.
- Brand red `--brand` (#e5463b) is the accent: the P logo, round buttons, the current menu item, hovers.
- Logo: the red P mark (inline SVG, a traced stand-in until the original file is supplied), top-left, no text. On hover its two parts (`.p-head`, `.p-stem`) spring apart and back.
- Navigation: at the top of every page, Work / About / Contact stack downwards top-right in large uppercase Geist (`.topnav`, current page in red with a dot to its left). After 120px of scrolling `site.js` sets `html.is-scrolled`; the links fade out and the glassy Menu pill (`.menu-toggle`) scales in, opening a compact panel (`#menu`). On phones only the Menu pill shows.
- Renders are the face of every project (no block massing). Each project's cover is its `cover` image (default `<slug>/render.webp`); home cards and the footer strip use it, with a slight zoom on hover. Event photos are supporting proof on project pages, labelled "On site".
- Portfolio page is a shelf (`.shelf` / `.book`): cards stand edge-on like books with a vertical spine label; the card under the pointer turns to face the front and shows its chip, client, title and "View project". `site.js` picks the open card from the pointer's position across the whole shelf (its width never changes), so nothing shifts under the pointer. Keyboard focus opens a card. On touch, narrow screens, or without JS, cards simply stack facing front.
- Brand carousel: client logo files supplied by Nicholas, in `public/assets/img/brands/<slug>.svg|png|webp` (names in that folder's README), in outlined squares drifting slowly left (pure CSS, two copies for a seamless loop, paused on hover; with reduced motion a still wrapping grid). They render as masks in muted red (`--logo`) and turn white on hover. A brand without a file shows its name as a small mono placeholder. Only use logo files Nicholas provides; never draw or trace one.
- Images sit in rounded tiles (`--radius`) with a tight 8px gap.
- Motion only answers the visitor or marks one moment: hero crossfade, menu opening, tile hover, sections fading up on scroll, and the curtain. Respect `prefers-reduced-motion` (the curtain and intro are skipped entirely).
- Curtain (after Dennis Snellenberg): first visit per browser session shows the intro: a deep red screen (`--curtain`) cycles "• Hello" through greetings, then lifts with a curved bottom edge. Internal links raise the curtain with a curved top edge and "• <page name>", then navigate; the next page opens covered and lifts. The `<head>` script sets `is-intro` / `is-entering` and `data-curtain` before paint; CSS does the lifting, `site.js` only cycles words and handles leaving (navigates when the rising curtain's animation ends). The leaving and arriving labels sit at exactly the same spot so the hand-off is invisible. Pages are prefetched on hover (speculation rules in `<head>`), and a cross-document view transition holds the frame between pages so there's no flash. Link labels come from `data-label` (project links use the client name) or the page name.

## Copy
- No email address or phone number anywhere on the site, including error messages: every enquiry goes through the brief form.
- No decorative numbers or counts anywhere (no "(16)" beside headings, no "4+", no 001/01 indexes). Nicholas has designed for more brands than are listed, so a count undersells him.
- Written to agencies: the reader is an account director or creative lead with a pitch coming. Say "your client", "your team", "your fabricator"; never address the brand directly. Cover creative work as a whole, 2D and 3D (concept, 3D and rendering, 2D graphics, drawings and artwork), not just 3D. Be sharp about the agency's return: pitches that win, capacity without headcount, the client relationship and margin stay theirs, fewer costly surprises on site. Key promises: we work under your name, we don't contact your client unless asked, design your fabricator and printer can produce.
- Don't promise turnaround times, revision rounds or on-site work unless Nicholas gives them.
- Plain, specific, no hype words. Write in sentence case; CSS handles the uppercase for headings and labels.
- Calls to action: "Let’s talk" (footer) and "Send brief" (form). Contact person: Nicholas.

## Every page shares
The same `<head>` (including the inline theme script), the floating controls, the `#menu` panel and the footer (not on Home). If you change one, change all of them (`public/**/*.html`, including `404.html`).

## Adding a project
1. Copy a folder in `public/portfolio/` and rename it with a lowercase-hyphen slug.
2. Update: `<title>`, meta description, `og:` tags, `<h1>`, the four meta items (Client, Event, Type, Scope), summary, body, image paths and alt text.
3. Images go in their own folder, `public/assets/img/projects/<slug>/`, as `render-01.webp`… and `photo-01.webp`… (see the README there), 2000 px on the long side at their own proportions, under 400 KB. Convert and resize if given larger files. Project pages show the renders first ("The render"), then photos ("The build"), as `full` or side-by-side `duo` figures. Set the project's `cover` (and `second`, for the footer strip) to its best render.
4. Add a `.tile` to `public/portfolio/index.html` with the right `data-type` (`exhibitions` | `roadshows`).
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
2. Pick the strongest render as the cover; use all good renders and photos on the project page, renders first. Show Nicholas a contact sheet of the picks before publishing if the choice isn't obvious.
3. Resize to 2000 px on the long side (no cropping), WebP, under 400 KB, into `public/assets/img/projects/<slug>/`. Use only the images Nicholas wants shown (for ORA 5, launch day only; the pre-launch set is not used).
4. Build the project page and tile as in "Adding a project", using his wording, tightened. Add it to the home features only if he said Yes.
5. Delete the `submissions/<slug>/` folder in the same commit.

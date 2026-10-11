# parahouse website

The studio site for Parahouse. Plain HTML and CSS served by Cloudflare Workers, plus a small Worker that emails contact-form briefs to you. Content and brand (green, lowercase italic wordmark, outlined italic serif headings) come from the 2026 capabilities deck. The layout takes its cue from the Foucault Framer template: full-bleed project images, floating pill controls, a dark drop-down menu, big condensed headings and rounded image tiles. It has a light/dark toggle that follows the visitor's system setting by default.

- No build step. What's in `public/` is exactly what goes live.
- Static pages and images are served free by Cloudflare. The Worker code only runs for `/api/contact`.

## What's in here

```
public/                     The website (every file here is published)
  index.html                Home: full-screen project showcase
  portfolio/index.html      Portfolio grid with filters
  portfolio/<project>/      One folder per project page
  about/  contact/
  404.html                  Shown for any missing page
  assets/css/site.css       All styles (colours, font and spacing at the top)
  assets/js/site.js         Menu, theme toggle, clock, showcase, filters, contact form
  assets/fonts/             Archivo, Geist, Geist Mono, self-hosted (open font licences included)
  assets/img/brands/        Client logo files (see the README in that folder for names)
  assets/img/projects/      Project and studio images (placeholders for now)
worker/index.js         Handles /api/contact and sends the email
wrangler.jsonc          Cloudflare settings
```

## Put it online (first time)

1. Push this folder to a GitHub repository.
2. Sign in to the Cloudflare dashboard and go to **Workers & Pages → Create → Import a repository**.
3. Pick the repository. Leave the build command empty; the deploy command is `npx wrangler deploy`.
4. Click **Deploy**. You'll get a `parahouse-site.<your-account>.workers.dev` address within a minute.
5. From then on, every push to the main branch redeploys the site automatically.

To use your own domain, open the Worker in the dashboard, go to **Settings → Domains & Routes → Add → Custom domain**, and enter e.g. `parahouse.sg`. The domain's DNS needs to be on Cloudflare for this.

## Turn on the contact form

The form works out of the box but replies "isn't connected yet" until you add an email service. It uses [Resend](https://resend.com) (free tier covers a studio site easily).

1. Create a Resend account and verify your domain there (it gives you DNS records to add in Cloudflare).
2. Create an API key in Resend.
3. In the Cloudflare dashboard, open the Worker → **Settings → Variables and Secrets**:
   - Add a **secret** `RESEND_API_KEY` with the key.
   - Set `CONTACT_TO` to the inbox that should receive briefs (comma-separate for several).
   - Set `CONTACT_FROM` to a sender on your verified domain, e.g. `Parahouse website <website@parahouse.sg>`.
4. Also update `CONTACT_FROM`/`CONTACT_TO` in `wrangler.jsonc` so the next deploy doesn't reset them (the secret is never in the repo).

Replies to an enquiry go straight to the person who sent it.

## Replace the placeholders

The text is real (from the capabilities deck). The images are not yet.

| Placeholder | Where |
|---|---|
| Project images (isometric stand-ins in each brand's colours) | `public/assets/img/projects/<project>-render.webp`, `-render-2`, `-built`, `-built-2` |
| Team photos | `public/assets/img/projects/studio-1.webp`, `studio-2.webp` (About page) |
| Instagram / LinkedIn links | Menu, contact page and footer of every page |
| Favicon (a green "p") | `public/assets/img/favicon.svg`; replace with the P logo mark |

Each project page pairs **the render** with **the build**, so for each project supply 2 renders and 2 event photos. Keep the same file names and the pages pick them up.

## Add a project

1. Copy an existing folder in `public/portfolio/`, e.g. `tidewater-pavilion/`, and rename it (lowercase, hyphens: `my-new-stand/`).
2. Edit its `index.html`: `<title>`, description, the heading, the four details (client, type, scope, year), the text, and the image paths.
3. Add images to `public/assets/img/projects/` named `<project>-render.webp`, `-render-2.webp`, `-built.webp`, `-built-2.webp`. Export at about 2000 × 1250 px as WebP or JPG, under 400 KB each.
4. Add a tile for it in `public/portfolio/index.html`. `data-type` must be `exhibitions` or `roadshows` so the filters work. Update the count in the heading.
5. To show it on the home page, add an image line and a list line in `public/index.html` (same order in both).
6. Update the "Next" pill links so the project pages still loop.

Or ask Claude Code: "Add a new project called X using the images in this folder." `CLAUDE.md` tells it how.

## Work on it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev          # site at http://localhost:8787, contact form included
```

For the contact form locally, copy `.dev.vars.example` to `.dev.vars` and fill it in. To deploy from your computer instead of GitHub: `npx wrangler login` once, then `npm run deploy`.

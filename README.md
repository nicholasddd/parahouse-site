# parahouse website

The studio site for parahouse, a Singapore design studio that works for agencies. Plain HTML and CSS served by Cloudflare Workers, plus a small Worker that emails contact-form briefs. Dark, with brand red as the accent; each project page takes on its project's own colour. `CLAUDE.md` holds the full design and copy rules.

- No build step. What's in `public/` is exactly what goes live.
- Static pages and images are served free by Cloudflare. The Worker code only runs for `/api/contact`.

## What's in here

```
public/                     The website (every file here is published)
  index.html                Home: hero, selected work, brands
  portfolio/index.html      Work: grid with search and filters
  portfolio/<slug>/         One folder per project page
  services/  about/  contact/
  404.html                  Shown for any missing page
  assets/css/site.css       All styles (colours, fonts and spacing at the top)
  assets/js/site.js         Menu, clock, curtain, cards, filters, FAQ, contact form
  assets/fonts/             Archivo, Geist, Geist Mono, self-hosted (open font licences included)
  assets/img/brands/        Client logo files (see the README in that folder for names)
  assets/img/projects/      One folder per project, same slug as its page (see the README inside)
submissions/                New projects waiting to be added (never published)
worker/index.js             Handles /api/contact and sends the email
wrangler.jsonc              Cloudflare settings
```

## Put it online (first time)

1. Push this folder to a GitHub repository.
2. Sign in to the Cloudflare dashboard and go to **Workers & Pages → Create → Import a repository**.
3. Pick the repository. Leave the build command empty; the deploy command is `npx wrangler deploy`.
4. Click **Deploy**. You'll get a `parahouse-site.<your-account>.workers.dev` address within a minute.
5. From then on, every push to the main branch redeploys the site automatically.

To use your own domain, open the Worker in the dashboard, go to **Settings → Domains & Routes → Add → Custom domain**, and enter e.g. `parahouse.co` (already set up in `wrangler.jsonc` `routes`). The domain's DNS needs to be on Cloudflare for this.

## The contact form

Briefs are emailed with Cloudflare Email Service, free and with no API key or outside email provider.

- `wrangler.jsonc` has a `send_email` binding (`EMAIL`) that may only send to `parahouse0@gmail.com`, the verified destination in Email Routing. Briefs go out from `website@parahouse.co`.
- Replies to a brief go straight to the person who sent it.
- To send briefs to a different inbox: add and verify it under **Email → Email Routing → Destination addresses** in Cloudflare, then change `CONTACT_TO` and `allowed_destination_addresses` in `wrangler.jsonc`.

Mail sent to hello@parahouse.co is forwarded to the same Gmail by Email Routing.

## Still to supply

| What | Where |
|---|---|
| The original P logo file (the current mark is a traced stand-in) | `public/assets/img/p-mark.svg` and the logo in every page |
| Instagram / LinkedIn links | Menu and footer of every page |
| Logo files for PropW and Cycle & Carriage | `public/assets/img/brands/` |

## Add a project

Send Claude Code the images and the details (client, event, date, scope), or drop them in `submissions/<slug>/` using the template there. `CLAUDE.md` says how a project is built: a page in `public/portfolio/<slug>/`, its images in `public/assets/img/projects/<slug>/`, and its card on the Work page and home page.

## Work on it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev          # site at http://localhost:8787, contact form included
```

For the contact form locally, copy `.dev.vars.example` to `.dev.vars` and fill it in. To deploy from your computer instead of GitHub: `npx wrangler login` once, then `npm run deploy`.

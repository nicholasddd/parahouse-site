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

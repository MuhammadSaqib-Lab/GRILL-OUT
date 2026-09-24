# Deployment checklist

## What gets deployed
| Part | What | Notes |
|---|---|---|
| Public site | `index.html`, `404.html`, `login/`, `signup/`, `account/`, `css/`, `js/`, `images/`, `site.webmanifest`, `robots.txt`, `sitemap.xml` | Static files. **Do not publish the repo root as-is**: it also holds source photos (`WhatsApp Image …`, `unnamed*.webp`) and `backend/`. Publish only the files above. |
| API + admin UI | `backend/` (`npm run build` → `npm start`) | Serves `/api/*` and `/admin/*`. Needs PostgreSQL. |

Simplest layout: one domain, reverse proxy sends `/api/*` and `/admin/*` to the Node app and everything else to the static files. Then the site talks to `/api` with no CORS at all. If the API is on another origin, set `window.GRILL_OUT_CONFIG.apiBaseUrl` in `js/config.js` and list the site's origin in `FRONTEND_URL`.

## 1. Production domain → SEO files
The canonical URL, `og:url`, `og:image`, JSON-LD `url`, `robots.txt` sitemap line and `sitemap.xml` all depend on the real domain, which is not stored anywhere in the repo. Set it once:

```bash
npm install                                   # repo root (Tailwind CLI)
npm run seo -- --url https://YOUR-REAL-DOMAIN # rewrites index.html SEO block, robots.txt, sitemap.xml
```
It refuses `http://`, localhost and private hosts. Re-run whenever the domain changes. Business facts (address, phone, hours) live in `seo/business.json` and must match the footer in `index.html`.

## 2. Rebuild CSS after changing any Tailwind class
```bash
npm run build:css     # css/tailwind.css (public) + backend/admin-ui/shared/admin.css (admin)
```
Both outputs are committed so the host needs no build step.

## 3. Backend environment (`backend/.env` on the server — never committed)
| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` (enables Secure cookies, `__Host-` cookie prefix, HSTS, unsafe-config guards) |
| `DATABASE_URL` | production Postgres URL, from the host's secret store |
| `ADMIN_JWT_SECRET` | `openssl rand -hex 32` — unique, never reused from dev |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | strong password (≥ 12 chars); the server refuses to boot with the placeholder values |
| `FRONTEND_URL` | comma-separated `https://` origins of the public site (no localhost — the server refuses to start otherwise) |
| `TRUST_PROXY` | number of proxy hops in front of Node (usually `1`) — required for correct per-IP rate limiting |
| `CUSTOMER_JWT_SECRET` | `openssl rand -hex 32` — must differ from `ADMIN_JWT_SECRET` (the server refuses to start otherwise) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | your mail provider. **`SMTP_HOST` is required in production** — without it order/reservation emails silently wouldn't be sent, so the server refuses to boot. `MAIL_FROM` should be an address on a domain you've set up SPF/DKIM for. |
| `ADMIN_NOTIFY_EMAIL` | inbox for "new order" / "new reservation" alerts (defaults to `ADMIN_EMAIL`) |
| `RATE_LIMIT_*`, `ADMIN_LOGIN_RATE_LIMIT_MAX`, `CUSTOMER_AUTH_RATE_LIMIT_MAX`, `CUSTOMER_SESSION_DAYS`, `DELIVERY_FEE` | see `.env.example` |

### Customer login and cookies
Customer sessions are an httpOnly cookie, so the website and the API must be **the same site** (same registrable domain — ideally the same origin, with the proxy sending `/api/*` to Node). If the API is on another origin, list the website's exact origin in `FRONTEND_URL` and set `apiBaseUrl` in `js/config.js`; a *different-site* API domain would need `SameSite=None`, which this project deliberately does not use. Serve everything over HTTPS (the cookie is `Secure` and `__Host-` prefixed in production).

## 4. Database
```bash
cd backend
npx prisma migrate deploy
NODE_ENV=production ALLOW_PRODUCTION_SEED=true npm run db:seed   # first deploy only
```
Change the admin password later with `npm run admin:set-password` (never re-seed).

Orders/reservations made before customer accounts existed stay with their old guest record and are never merged automatically. To attach them to a customer who has since registered — after you've confirmed they own the email — run `npm run customers:link-legacy -- --email their@email.com` (dry run), then add `--apply`.

## 5. Headers for the static host (public site)
The API already sends its own security headers. Configure the static host to add:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
X-Frame-Options: DENY
Cache-Control: public, max-age=31536000, immutable      (for /images/*, and /css/* /js/* if filenames are versioned)
Cache-Control: no-cache                                  (for index.html)
```
The public page loads Google Fonts, Unsplash images and one SRI-pinned script (vanilla-tilt from cdnjs). A CSP for it must allow `fonts.googleapis.com`, `fonts.gstatic.com`, `images.unsplash.com`, `cdnjs.cloudflare.com`, inline `onerror` handlers on menu images (`'unsafe-hashes'`/or move them to JS), and `connect-src` for the API origin — test it before enforcing.
Serve `404.html` for unknown paths.

## 6. After deploy — verify
- `https://DOMAIN/robots.txt`, `/sitemap.xml` load; page source has one canonical with the real domain.
- `https://DOMAIN/admin/` → login page, with `X-Robots-Tag: noindex`. `GET /api/admin/orders` without a session → `401`.
- Sign up a test customer, place a test order and reservation, confirm the admin alert emails arrive, confirm/cancel them in the dashboard and check the customer emails + `/account/`; then delete the test data.
- Submit the sitemap in Google Search Console.

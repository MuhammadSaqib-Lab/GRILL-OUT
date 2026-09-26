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
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | **Optional.** Normally leave unset — `npm run admin:setup` asks you (see *Admin account* below). Only for unattended setups; server-side only, read only by that command, never needed while the server runs. |
| `FRONTEND_URL` | comma-separated `https://` origins of the public site (no localhost — the server refuses to start otherwise) |
| `TRUST_PROXY` | number of proxy hops in front of Node (usually `1`) — required for correct per-IP rate limiting |
| `CUSTOMER_JWT_SECRET` | `openssl rand -hex 32` — must differ from `ADMIN_JWT_SECRET` (the server refuses to start otherwise) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | your mail provider. **`SMTP_HOST` is required in production** — without it order/reservation emails silently wouldn't be sent, so the server refuses to boot. `MAIL_FROM` should be an address on a domain you've set up SPF/DKIM for. |
| `ADMIN_NOTIFY_EMAIL` | inbox for "new order" / "new reservation" alerts (falls back to `ADMIN_EMAIL` if that is set). **Required in production** (one of the two) — otherwise the restaurant is never told about new orders/reservations, so the server refuses to boot. In development with neither set, alerts are skipped with a logged warning. |
| `RESTAURANT_TIMEZONE` | IANA timezone the restaurant runs on (default `Asia/Karachi`). Decides what "today" means for reservation dates/past-time checks and the dashboard's today/week/month figures, independent of the server's own clock. |
| `RATE_LIMIT_*`, `ADMIN_LOGIN_RATE_LIMIT_MAX`, `CUSTOMER_AUTH_RATE_LIMIT_MAX`, `CUSTOMER_SESSION_DAYS`, `DELIVERY_FEE` | see `.env.example` |

### Customer login and cookies
Customer sessions are an httpOnly cookie, so the website and the API must be **the same site** (same registrable domain — ideally the same origin, with the proxy sending `/api/*` to Node). If the API is on another origin, list the website's exact origin in `FRONTEND_URL` and set `apiBaseUrl` in `js/config.js`; a *different-site* API domain would need `SameSite=None`, which this project deliberately does not use. Serve everything over HTTPS (the cookie is `Secure` and `__Host-` prefixed in production).

## 4. Database
```bash
cd backend
npx prisma migrate deploy
NODE_ENV=production ALLOW_PRODUCTION_SEED=true npm run db:seed   # first deploy only: loads the menu (no admin account)
npm run admin:setup                                                # asks for your admin email + password (hidden) — see below
```
### Admin account
No admin email or password exists anywhere in the repository, the seed, or the defaults — you choose them, at setup time:

```bash
cd backend
npm run admin:setup
```
It asks **Enter your admin email:** and **Enter your admin password:** (the password is masked as you type and asked twice; rules: 12+ characters, max 72 bytes, a letter and a number). Invalid answers are explained and asked again, and nothing is saved until both are valid. Only a bcrypt hash is stored — the password is never printed, logged, or written to any file, and you do not edit `.env`.

- **Unattended setups** (a host's one-off command with no terminal): supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` through the host's secret/environment settings instead; they are used as-is and never printed. With no terminal and nothing supplied, the command stops with an explanation rather than guessing.
- **Re-running is safe and duplicate-free:** it updates the existing admin (email and password) instead of adding another, and signs out that account's active sessions. If several admin accounts exist and the email you enter matches none, it stops and explains rather than overwrite one. Use the same command to change the login later. Never re-run `db:seed` for this.
- Login is case-insensitive on the email.

> The old built-in default admin login appeared in earlier git commits (it was a placeholder, but treat it as public). Running `admin:setup` replaces that account's email and password; do not reuse the old values anywhere.

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

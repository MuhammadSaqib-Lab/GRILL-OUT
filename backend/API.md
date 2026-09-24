# Grill Out API

REST API for the Grill Out restaurant website, backed by **PostgreSQL via
Prisma** (see [Architecture](#architecture) and `DATABASE.md` for the full
schema/setup). No authentication — every endpoint here is intentionally
public, matching what the existing frontend needs today.

Base URL (local dev): `http://localhost:4000/api`

## Response envelope

Every endpoint returns one of these two shapes. Never a bare object, never a bare array.

**Success**
```json
{ "success": true, "data": { }, "message": "optional human-readable note" }
```

**Error**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request data", "details": { } } }
```

`error.details` is present for `VALIDATION_ERROR` (Zod's field-error map) and omitted otherwise.

## Error codes

| HTTP | code | when |
|---|---|---|
| 400 | `VALIDATION_ERROR` | request body/params/query failed schema validation |
| 400 | `MALFORMED_JSON` | request body isn't valid JSON |
| 400 | `BAD_REQUEST` | valid shape, but semantically wrong (e.g. ordering a menu item that doesn't exist) |
| 401 | `UNAUTHORIZED` | admin API: no/invalid/expired/revoked session, or wrong email/password at login |
| 403 | `CORS_NOT_ALLOWED` | request Origin isn't in the allowlist |
| 404 | `NOT_FOUND` | resource (menu item / order / reservation / category) doesn't exist |
| 404 | `ROUTE_NOT_FOUND` | no route matches the method + path |
| 409 | `CONFLICT` | e.g. cancelling an order/reservation that's already past a cancellable state, or a unique-constraint violation |
| 429 | `RATE_LIMITED` | too many requests (public writes, public id lookups, admin login) |
| 500 | `INTERNAL_ERROR` | unexpected server error (message is generic; details only in dev) |
| 503 | `DATABASE_UNAVAILABLE` | the database connection is down |

---

## Health

### `GET /api/health`
No auth, no rate limit. Always `200` — the API process being reachable and
the database being reachable are reported separately (`status` degrades to
`"degraded"` rather than the endpoint itself failing, so a monitoring check
can tell "API is down" apart from "API is up but DB is down"). Never
includes `DATABASE_URL`, credentials, or any other connection detail.

**Response `200`**
```json
{ "success": true, "data": { "status": "ok", "database": "connected", "timestamp": "2026-09-22T13:00:00.000Z" } }
```
`status` is `"ok"` when `database` is `"connected"`, otherwise `"degraded"` with `database: "unavailable"`. It deliberately reports no environment name or uptime.

---

## Menu

Backed by PostgreSQL (`MenuCategory` / `MenuItem` / `MenuItemOption` — see
`DATABASE.md`), seeded from `src/data/menu.data.ts`, itself a direct,
generated port of the frontend's own `IMG` bank + `MENU_ITEMS` +
`CATEGORIES` (see `backend/scripts/generate-menu-data.js`). Names, prices,
descriptions, images and categories are exactly what the site already
shows; nothing was retyped by hand at any step from frontend → seed → database.

### `GET /api/menu`
Query params (both optional): `available=true|false`, `featured=true|false`.

**Response `200`** — array of `MenuItem`:
```json
{
  "success": true,
  "data": [
    {
      "id": 21,
      "name": "Ba Zinga",
      "description": "Crispy fried chicken fillet, melted cheese & our signature peri peri sauce.",
      "price": 599,
      "category": "burgers",
      "image": "https://images.unsplash.com/...",
      "available": true,
      "featured": true,
      "tags": [],
      "createdAt": "2026-09-22T13:00:00.000Z",
      "updatedAt": "2026-09-22T13:00:00.000Z"
    }
  ]
}
```

Items with size/variant pricing (pizza sizes, steak chicken/beef, wing
piece-counts, etc.) additionally carry an `options` array and `price` is
the *lowest* option price:
```json
{ "id": 1, "name": "Crown Crust Pizza", "price": 1399, "options": [{ "label": "M", "price": 1399 }, { "label": "L", "price": 1949 }], "...": "..." }
```

### `GET /api/menu/:id`
`id` must be a positive integer.

- `200` → single `MenuItem`
- `400 VALIDATION_ERROR` → `id` isn't numeric
- `404 NOT_FOUND` → no item with that id

### `GET /api/menu/category/:category`
`category` must be one of the keys from `GET /api/categories` (e.g. `burgers`, `pizza-special`, `wow-deals`).

- `200` → array of `MenuItem` (possibly empty)
- `404 NOT_FOUND` → category key doesn't exist

---

## Categories

### `GET /api/categories`
**Response `200`**
```json
{ "success": true, "data": [{ "key": "pizza-special", "label": "Special Pizzas" }, "..."] }
```

---

## Customer accounts

Customers register and log in on the main website (`/signup/`, `/login/`, `/account/`) — there is no separate portal and no second login.

The session is an **httpOnly cookie** (`grillout_session`, `__Host-` prefixed in production; `SameSite=Lax`, `Secure` in production, `CUSTOMER_SESSION_DAYS` long). It is signed with `CUSTOMER_JWT_SECRET` — a different secret, cookie name and audience from the admin session, so neither can be used as the other. Every request is re-checked against the database (account exists, session version current), so logout revokes every device immediately. Browsers must send it with `credentials: "include"`; CORS reflects only exact origins from `FRONTEND_URL` and answers `Access-Control-Allow-Credentials: true` for them.

**The server always identifies the customer from the session.** No route accepts a customer id, email or "who am I" from the body/query/path. Someone else's order or reservation is reported as `404`, exactly like a missing one.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/customer/signup` | `{ name, email, password, confirmPassword? }` → `201`, sets the cookie, returns `{ name, email }`. Password: 8–128 chars with a letter and a number, stored as a bcrypt hash. Email is lower-cased; duplicate → `409`. Unknown fields (`id`, `passwordHash`, …) are dropped. Rate limited (`CUSTOMER_AUTH_RATE_LIMIT_MAX`). |
| POST | `/api/auth/customer/login` | `{ email, password }` → `200` + cookie. Wrong password / unknown email / legacy guest: the same `401`, same work factor. Rate limited (separate counter). |
| POST | `/api/auth/customer/logout` | Clears the cookie and revokes all of this customer's sessions. Harmless without a session. |
| GET | `/api/auth/customer/me` | `{ name, email }`, or `401`. |
| GET | `/api/customer/orders` | The customer's own orders, newest first (max 100), each with items, totals, status and `adminMessage`. |
| GET | `/api/customer/orders/:id` | One of their own orders, else `404`. |
| GET | `/api/customer/reservations` | Their own reservations, newest first. |
| GET | `/api/customer/reservations/:id` | One of their own, else `404`. |

Cross-site protection: requests carrying an `Origin` that isn't allowlisted are refused (`403`) before any handler runs, the cookie is `SameSite=Lax`, and the API only reads JSON bodies.

**Legacy data.** Orders/reservations placed before accounts existed belong to passwordless guest rows and are never attached to an account automatically (that would let anyone claim an email's history without proving they own it). An operator can link them deliberately: `npm run customers:link-legacy -- --email a@b.com` (dry run) then `--apply`.

## Orders

Prices are **never** trusted from the client. Every order line is priced
fresh from PostgreSQL, and the whole order — availability checks, pricing,
`Order` row and `OrderItem` rows — is written in a
single Prisma transaction: if any line is invalid, everything rolls back
and no partial order is ever left in the database. If the client sends a
price, quantity discount, or total, it's ignored.

### `POST /api/orders`
**Requires a logged-in customer** (`401` otherwise). The order belongs to that account; the name and email on it come from the account, not the request. Rate-limited (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS`, see `.env.example`). The restaurant is emailed the new order.

**Request**
```json
{
  "phone": "0300-1234567",
  "items": [
    { "menuItemId": 21, "quantity": 2 },
    { "menuItemId": 1, "optionLabel": "L", "quantity": 1 }
  ],
  "orderType": "delivery",
  "deliveryAddress": "House 12, Street 4, GT Road, Haripur",
  "specialInstructions": "Extra spicy, no onions"
}
```
- `specialInstructions` optional. `customerName`/`email` are not accepted (ignored). `deliveryAddress` is **required** when `orderType` is `"delivery"`.
- Each `items[]` entry needing a size (an item that has `options` in the menu) **must** include the matching `optionLabel`; flat-price items must **not**.

**Response `201`**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "ORD-A1B2C3D4",
    "customerName": "Ahmed Khan",
    "phone": "0300-1234567",
    "items": [
      { "menuItemId": 21, "name": "Ba Zinga", "unitPrice": 599, "quantity": 2, "subtotal": 1198 },
      { "menuItemId": 1, "name": "Crown Crust Pizza", "optionLabel": "L", "unitPrice": 1949, "quantity": 1, "subtotal": 1949 }
    ],
    "subtotal": 3147,
    "deliveryFee": 150,
    "total": 3297,
    "orderType": "delivery",
    "deliveryAddress": "House 12, Street 4, GT Road, Haripur",
    "status": "PENDING",
    "createdAt": "2026-09-22T13:00:00.000Z",
    "updatedAt": "2026-09-22T13:00:00.000Z"
  }
}
```

**Errors**
- `401 UNAUTHORIZED` — not logged in
- `400 VALIDATION_ERROR` — missing/malformed fields, delivery with no address, bad phone
- `400 BAD_REQUEST` — a `menuItemId` that doesn't exist, an item that's `available: false`, a missing/invalid `optionLabel` for a sized item

Order statuses: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `COMPLETED`, or `CANCELLED` at any point before `COMPLETED`. A customer can only cancel their own order (below); every other transition is made by an admin, optionally with a message the customer sees.

`OrderItem` rows snapshot `itemNameSnapshot`, `optionLabelSnapshot`, and `unitPrice` at the moment of purchase — a later menu price change or even the menu item being deleted never alters a historical order's `items[]`.

There is no public `GET /api/orders/:id` any more — customers read their orders through `GET /api/customer/orders[/:id]` (above). `adminMessage` is plain text; clients must render it as text, never HTML.

### `POST /api/orders/:id/cancel`
Requires login and ownership. Only valid while status is `PENDING` or `CONFIRMED`; clears any admin message.
- `200` → the order with `status: "CANCELLED"`
- `401` — not logged in
- `404 NOT_FOUND` — not found, or not this customer's order
- `409 CONFLICT` — already past a cancellable state

---

## Reservations

Field names and the `guests` enum match `#reservation-form` in `index.html`
exactly (`res-name`, `res-phone`, `reservation-date`, `res-time`,
`res-guests`, `res-notes`) so the existing form needed no redesign to call
this API — see [Frontend integration](#frontend-integration-changes).

### `POST /api/reservations`
**Requires a logged-in customer.** The reservation belongs to that account; name and email come from the account. Rate-limited, same as orders. The restaurant is emailed the new reservation.

**Request**
```json
{
  "phone": "0300-1234567",
  "date": "2026-09-25",
  "time": "19:00",
  "guests": "3-4",
  "specialRequests": "Birthday, outdoor seating"
}
```
- `specialRequests` optional. `customerName`/`email` are not accepted (ignored).
- `date` must be `YYYY-MM-DD`, today or later.
- `time` must be `HH:MM` (24h).
- `guests` must be exactly one of `"1-2" | "3-4" | "5-6" | "7+"`.

**Response `201`**
```json
{
  "success": true,
  "message": "Reservation confirmed",
  "data": {
    "id": "RES-A1B2C3D4",
    "customerName": "Ahmed Khan",
    "phone": "0300-1234567",
    "date": "2026-09-25",
    "time": "19:00",
    "guests": "3-4",
    "status": "PENDING",
    "createdAt": "2026-09-22T13:00:00.000Z",
    "updatedAt": "2026-09-22T13:00:00.000Z"
  }
}
```

No public `GET /api/reservations/:id` — customers read theirs through `GET /api/customer/reservations[/:id]`. A reservation carries `adminMessage` (plain text) when an admin left a note with the latest status change.

### `POST /api/reservations/:id/cancel`
Requires login and ownership. Only valid while status is `PENDING` or `CONFIRMED`.
- `200` → the reservation with `status: "CANCELLED"`
- `401` — not logged in
- `404 NOT_FOUND` — not found, or not this customer's
- `409 CONFLICT`

---

## Endpoints deliberately not built

The frontend (`index.html`) has no contact form and no newsletter signup —
just static footer text (address/phone/hours) and social links. Per the
brief's own instruction to build only what's actually required, `POST
/api/contact` and `POST /api/newsletter` were not implemented. Add them the
same way as reservations (validator → service → controller → route) if/when
those forms are built.

Admin endpoints exist for the dashboard — see **Admin API** below.

---

## Architecture

```
Controller  →  Service  →  Repository  →  Prisma  →  PostgreSQL
```

- **Controllers** (`src/controllers/`) — parse `req`, call a service, call `sendSuccess`. No business logic, no Prisma imports.
- **Services** (`src/services/`) — business rules: which delivery fee applies, cancellation eligibility, category validation. Depend only on repository *interfaces*.
- **Repositories** (`src/repositories/`) — the only files that import `@prisma/client` or touch `src/config/prisma.ts`. Each exports an interface (`MenuRepository`, `OrderRepository`, `ReservationRepository`) and a `Prisma*` implementation of it; `PrismaOrderRepository.createOrder` and `PrismaReservationRepository.createReservation` are where the transactional, database-price-is-authoritative logic lives.
- **Validators** (`src/validators/`) — Zod schemas, applied by the generic `validateRequest` middleware before a controller ever runs.

See `DATABASE.md` for the full schema, migration/seed commands, and local setup. See `src/config/prisma.ts` for the Prisma Client singleton.

## Admin API

Everything under `/api/admin` powers the dashboard in `admin-ui/` (served at `/admin/`).
It is **never** cached (`Cache-Control: no-store`), never indexed (`X-Robots-Tag: noindex`),
and — apart from login/logout — every route sits behind `requireAdmin`, which on **every
request**: verifies the signed session cookie (HS256 pinned), loads the admin account and
checks the token's session version. A deleted account or a logout revokes access immediately.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/auth/login` | `{ email, password }` → sets an HttpOnly, SameSite=Strict, Secure (prod) cookie. Wrong email and wrong password are indistinguishable (same 401, same work factor). Rate limited (`ADMIN_LOGIN_RATE_LIMIT_MAX`). |
| POST | `/api/admin/auth/logout` | Clears the cookie **and** bumps the account's session version, so a copied cookie stops working. |
| GET | `/api/admin/auth/me` | Current admin profile. |
| GET | `/api/admin/dashboard` | Real aggregates: orders/revenue today/week/month, status counts, popular items. |
| GET | `/api/admin/orders` | `page`, `limit` (≤100), `status`, `orderType`, `search` — server-side. |
| GET | `/api/admin/orders/:id` | Full order incl. customer details and price snapshots. |
| PATCH | `/api/admin/orders/:id/status` | `{ status, message? }` — `message` is an optional note to the customer (string, trimmed, ≤ 500 chars; `""`, whitespace, `null` or omitted = none). It replaces the previous message, so a note only ever belongs to the current status; a change with no message clears it. Orders are never deleted — rejecting an order is `status: "CANCELLED"` (+ reason). Terminal orders can't be reopened. |
| GET / PATCH | `/api/admin/reservations[/:id[/status]]` | Filters: `status`, `when=today\|upcoming`, `search`. PATCH takes `{ status, message? }` exactly like orders. |
| GET | `/api/admin/customers` | `search`, pagination; totals computed server-side. |
| GET/POST/PATCH/DELETE | `/api/admin/menu/categories[/:id]` | DELETE deactivates instead if the category still has items. |
| GET/POST/PATCH/DELETE | `/api/admin/menu/items[/:id]` | DELETE deactivates instead if any past order references the item. Image must be an http(s) URL; price ≤ 1,000,000. |

Numeric ids must be digits only and ≤ 2,147,483,647 (else `400`). A page beyond 100,000 is a `400`.

## Email

Sent through SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`); with `SMTP_HOST` unset nothing is sent and a one-line "would send" entry (masked recipient + subject) is logged. In production `SMTP_HOST` is required.

| When | To | Content |
|---|---|---|
| Customer places an order | `ADMIN_NOTIFY_EMAIL` (else `ADMIN_EMAIL`) | customer name/email/phone, order number, items, totals, address, notes |
| Customer books a table | same | customer name/email/phone, number, date, time, guests, requests |
| Admin confirms / cancels an order | the customer's account email | "Your Grill Out Order Has Been Confirmed / Cancelled", number, summary, status, and *Message from Grill Out* only if the admin wrote one |
| Admin confirms / cancels a reservation | the customer's account email | same idea for the reservation |
| Any other status change **with** an admin message | the customer | update + the message |

Emails are sent after the database write and never block or fail the request; failures are logged. Every customer/admin-supplied value is HTML-escaped in the HTML body.

## Security summary

- **Money is never trusted from the client**: prices, subtotal, delivery fee and total are recomputed from PostgreSQL inside one transaction; unavailable items, unknown options, quantities outside 1–50 and carts over 50 lines are rejected.
- **Free text** (names, addresses, notes) rejects `<` `>` and control characters, and the admin UI HTML-escapes everything it renders (defence in depth against stored XSS).
- **Headers**: strict CSP (no inline scripts, no CDN), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `frame-ancestors 'none'`, HSTS in production.
- **CORS**: exact-origin allowlist (`FRONTEND_URL`); never `*`. In production every origin must be `https://` and non-localhost or the server refuses to start.
- **Errors**: generic bodies only; stack traces and Prisma messages stay in server logs. Logs record the path, never the query string.
- Set `TRUST_PROXY` to the number of reverse-proxy hops in production so rate limits key on the real client IP (see `../DEPLOYMENT.md`).

# Grill Out — Database

PostgreSQL + Prisma ORM. This document covers local setup, the schema, and
how migrations/seeding work. See `API.md` for the HTTP contract this data
layer serves.

## 1. PostgreSQL requirements

- PostgreSQL 14+ (developed and tested against **16.15**).
- One database for normal development, a second for running the test suite
  against (tests write real rows — they must never run against your dev
  or, obviously, production data).

Local setup used for this project:
```bash
psql -U postgres -c "CREATE DATABASE grillout;"
psql -U postgres -c "CREATE DATABASE grillout_test;"
```

## 2. `DATABASE_URL` setup

Copy `.env.example` to `.env` and fill in a real connection string:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```
Local example:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grillout?schema=public"
```
Never commit `.env`. Never put `DATABASE_URL` (or any credential) in source
code — `src/config/env.ts` is the only place that reads it, via
`process.env`, validated with Zod at startup (the server refuses to boot if
it's missing or isn't a `postgresql://` URL).

## 3. Prisma installation

Already in `package.json` (`prisma` in devDependencies, `@prisma/client` in
dependencies). Pinned to **5.22.0** exactly — deliberately, not `latest`:
the newest `prisma` CLI releases bundle Prisma's hosted-Postgres/"Composer"
cloud tooling, which pulls in a large, unrelated dependency tree (AWS SDK
bits, a Cloudflare Workers runtime, etc.) that this project — a single
local/self-hosted Postgres — has no use for and that made the install
network-flaky. If you ever bump the version, prefer another pinned 5.x
release over `latest` unless you specifically want that cloud tooling.

```bash
npm install
npm run db:generate   # prisma generate — regenerates node_modules/@prisma/client from schema.prisma
```

## 4. Migration commands

```bash
npm run db:migrate           # prisma migrate dev — creates + applies a new migration (local/dev)
npm run db:migrate:deploy    # prisma migrate deploy — applies existing migrations, no new ones (CI/prod)
npm run db:validate          # prisma validate — schema syntax/consistency check only
```

The initial migration (`20260923135412_initial_grill_out_database`) creates
all 7 tables listed below. It has been applied to both `grillout` and
`grillout_test` for this project already.

## 5. Seed commands

```bash
npm run db:seed        # prisma db seed  (equivalent: npm run prisma:seed)
```

Seeds from `src/data/menu.data.ts` — which is itself generated from the
frontend's own `js/script.js` (`npm run generate:menu-data`, defined in the
main backend `package.json`). **The seed is idempotent**: every write is an
`upsert` keyed on a stable identifier —

- `MenuCategory` by `slug`
- `MenuItem` by `id` (the exact 1–99 the frontend hardcodes in
  `data-add-to-cart="21"` etc. — preserved on purpose, not regenerated)
- `MenuItemOption` by the `(menuItemId, label)` compound unique constraint

Running `npm run db:seed` any number of times produces the same 20
categories / 99 menu items / 171 options — verified by running it twice in
a row and confirming identical counts (see the Phase-2 final report).

To seed a different database (e.g. the test one), override `DATABASE_URL`
for that one command:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grillout_test?schema=public" npx tsx prisma/seed.ts
```

## 6. Prisma Studio

```bash
npm run db:studio
```
Opens a local GUI (http://localhost:5555 by default) for browsing/editing
tables directly — handy for spot-checking seeded data or a test order/reservation.

## 7. Schema overview

7 tables (`prisma/schema.prisma` is the source of truth; this is the summary):

| Model | Purpose |
|---|---|
| `MenuCategory` | The 20 real menu sections (Special Pizzas, Burgers, Wow Deals, …). `slug` is the stable key the API and frontend filter tabs already use. |
| `MenuItem` | The 99 real dishes. `price` is the base/lowest price; `image`, `description`, `tags` (e.g. `["spicy"]`), `isFeatured` (Chef's Special badge) all preserved from the frontend. |
| `MenuItemOption` | Size/variant pricing for items that have it (pizza M/L, steak chicken/beef, wing piece-counts, the entire Cold Station / Bubble Tea sections, …). 171 rows seeded. |
| `Customer` | Upserted by phone number whenever an order or reservation comes in. No password, no login — guest checkout stays guest checkout; this just gives repeat customers one row instead of being invisible to future reporting. |
| `Order` | One row per order. `subtotal` / `deliveryFee` / `total` are `Decimal(10,2)`, computed server-side, never from client input. |
| `OrderItem` | One row per order line. Snapshots `itemNameSnapshot`, `optionLabelSnapshot`, `unitPrice` at purchase time — see §9. |
| `Reservation` | One row per table reservation. `date`/`time`/`guests` are plain strings matching the frontend's own `<input type="date">` / `<input type="time">` / `<select>` values exactly — no timezone or enum-mapping surprises. |

No `ContactMessage` or `NewsletterSubscriber` tables: `index.html` has
neither a contact form nor a newsletter signup (checked before writing the
schema, and re-checked — nothing to back).

Money is `Decimal(10,2)` everywhere, never floating point.

## 8. Relationships

```
MenuCategory (1) ──── (many) MenuItem (1) ──── (many) MenuItemOption
                                  │
                                  │ (many, via OrderItem — see below)
                                  │
Customer (1) ──── (many) Order (1) ──── (many) OrderItem
    │
    └──── (many) Reservation
```

Delete behavior was chosen specifically to protect historical order data
(explicit requirement — nothing here cascades destructively over it):

| Relation | onDelete | Why |
|---|---|---|
| `MenuItem.category` | `Restrict` | Can't delete a category while it still has items — forces an explicit reassignment instead of silently orphaning/cascading. |
| `MenuItemOption.menuItem` | `Cascade` | An option is pure sub-data of its item; deleting the item legitimately takes its own options with it. |
| `OrderItem.menuItem` | `SetNull` (nullable FK) | **The important one.** Deleting or editing a `MenuItem` must never corrupt a past order. `itemNameSnapshot` / `optionLabelSnapshot` / `unitPrice` already have everything needed to redisplay the line; `menuItemId` just goes `null`. Verified by a test that creates an item, orders it, deletes the item, and confirms the order still reads back correctly. |
| `OrderItem.order` | `Cascade` | Deleting an `Order` itself legitimately takes its own line items with it — this isn't "unrelated action destroys history," it's deleting the order. |
| `Order.customer` / `Reservation.customer` | `SetNull` (nullable FK) | Deleting a `Customer` record must not delete their order/reservation history. |

## 9. Historical price snapshots (why `OrderItem` looks the way it does)

If "Zooper Beef" is Rs. 649 today and the restaurant raises it to Rs. 750
next month, every order placed *before* that change must keep showing
Rs. 649 — that's what the customer actually paid. `OrderItem` stores
`itemNameSnapshot`, `optionLabelSnapshot`, and `unitPrice` at the moment of
purchase specifically so historical orders never depend on
`MenuItem.price` as it exists *now*. Covered by an automated test
(`tests/orders.test.ts`) that places an order, changes the menu price, and
asserts the order's line item is unaffected.

## 10. Local development instructions

```bash
# 1. Postgres running locally, two databases created (see §1)
# 2. cd backend && cp .env.example .env, fill in DATABASE_URL
npm install
npm run db:generate
npm run db:migrate            # creates/applies migrations against grillout
npm run db:seed               # seeds grillout
npm run dev                   # tsx watch — hot-reloads on file change
```

Running the test suite (uses `grillout_test`, configured in `vitest.config.ts`):
```bash
# one-time: apply the same migration + seed to the test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grillout_test?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grillout_test?schema=public" npx tsx prisma/seed.ts

npm test
```

## 11. Production migration instructions

```bash
# never run `migrate dev` against production — it can prompt/reset
DATABASE_URL="<production connection string>" npx prisma migrate deploy
# FIRST deploy only: loads the menu + creates the admin account. The seed resets every
# menu item to the source data, so it refuses to run in production unless you opt in:
NODE_ENV=production ALLOW_PRODUCTION_SEED=true DATABASE_URL="<production connection string>" npm run db:seed

# Later, to change the admin password WITHOUT touching menu data (signs out all sessions):
NODE_ENV=production DATABASE_URL="<production connection string>" ADMIN_PASSWORD="<new password>" npm run admin:set-password
```
`migrate deploy` only applies migrations already committed under
`prisma/migrations/` — it never generates new ones or asks questions,
which is what makes it safe for CI/CD. Set `DATABASE_URL` via your hosting
platform's secret/environment-variable store, never in a committed file.

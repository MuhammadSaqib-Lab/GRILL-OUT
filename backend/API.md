# Grill Out API

REST API for the Grill Out restaurant website. **Phase 1**: in-memory data,
database-ready architecture (see [Architecture](#architecture)). No
authentication — every endpoint here is intentionally public, matching what
the existing frontend needs today.

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
| 403 | `CORS_NOT_ALLOWED` | request Origin isn't in the allowlist |
| 404 | `NOT_FOUND` | resource (menu item / order / reservation / category) doesn't exist |
| 404 | `ROUTE_NOT_FOUND` | no route matches the method + path |
| 409 | `CONFLICT` | e.g. cancelling an order/reservation that's already past a cancellable state |
| 429 | `RATE_LIMITED` | too many requests to a write endpoint |
| 500 | `INTERNAL_ERROR` | unexpected server error (message is generic; details only in dev) |

---

## Health

### `GET /api/health`
No auth, no rate limit.

**Response `200`**
```json
{ "success": true, "data": { "status": "ok", "environment": "development", "uptimeSeconds": 42, "timestamp": "2026-09-22T13:00:00.000Z" } }
```

---

## Menu

Backed by `src/data/menu.data.ts` — a direct, generated port of the
frontend's own `IMG` bank + `MENU_ITEMS` + `CATEGORIES` (see
`backend/scripts/generate-menu-data.js`). Names, prices, descriptions,
images and categories are exactly what the site already shows; nothing was
retyped by hand.

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

## Orders

Prices are **never** trusted from the client. Every order line is resolved
against the live menu repository server-side; if the client sends a price,
quantity discount, or total, it's ignored.

### `POST /api/orders`
Rate-limited (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS`, see `.env.example`).

**Request**
```json
{
  "customerName": "Ahmed Khan",
  "phone": "0300-1234567",
  "email": "ahmed@example.com",
  "items": [
    { "menuItemId": 21, "quantity": 2 },
    { "menuItemId": 1, "optionLabel": "L", "quantity": 1 }
  ],
  "orderType": "delivery",
  "deliveryAddress": "House 12, Street 4, GT Road, Haripur",
  "specialInstructions": "Extra spicy, no onions"
}
```
- `email`, `specialInstructions` optional. `deliveryAddress` is **required** when `orderType` is `"delivery"`.
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
      { "menuItemId": 21, "name": "Ba Zinga", "unitPrice": 599, "quantity": 2, "lineTotal": 1198 },
      { "menuItemId": 1, "name": "Crown Crust Pizza", "optionLabel": "L", "unitPrice": 1949, "quantity": 1, "lineTotal": 1949 }
    ],
    "subtotal": 3147,
    "deliveryCharge": 150,
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
- `400 VALIDATION_ERROR` — missing/malformed fields, delivery with no address, bad phone/email
- `400 BAD_REQUEST` — a `menuItemId` that doesn't exist, an item that's `available: false`, a missing/invalid `optionLabel` for a sized item

Order statuses: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `COMPLETED`, or `CANCELLED` at any point before `COMPLETED`. Phase 1 only exposes the cancel transition (below); the rest are for kitchen/admin tooling in a later phase.

### `GET /api/orders/:id`
- `200` → the `Order`
- `404 NOT_FOUND`

### `POST /api/orders/:id/cancel`
Only valid while status is `PENDING` or `CONFIRMED`.
- `200` → the `Order` with `status: "CANCELLED"`
- `404 NOT_FOUND`
- `409 CONFLICT` — already past a cancellable state

---

## Reservations

Field names and the `guests` enum match `#reservation-form` in `index.html`
exactly (`res-name`, `res-phone`, `reservation-date`, `res-time`,
`res-guests`, `res-notes`) so the existing form needed no redesign to call
this API — see [Frontend integration](#frontend-integration-changes).

### `POST /api/reservations`
Rate-limited, same as orders.

**Request**
```json
{
  "customerName": "Ahmed Khan",
  "phone": "0300-1234567",
  "email": "ahmed@example.com",
  "date": "2026-09-25",
  "time": "19:00",
  "guests": "3-4",
  "specialRequests": "Birthday, outdoor seating"
}
```
- `email`, `specialRequests` optional.
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

### `GET /api/reservations/:id`
- `200` → the `Reservation`
- `404 NOT_FOUND`

### `POST /api/reservations/:id/cancel`
Only valid while status is `PENDING` or `CONFIRMED`.
- `200` → the `Reservation` with `status: "CANCELLED"`
- `404 NOT_FOUND`
- `409 CONFLICT`

---

## Endpoints deliberately not built

The frontend (`index.html`) has no contact form and no newsletter signup —
just static footer text (address/phone/hours) and social links. Per the
brief's own instruction to build only what's actually required, `POST
/api/contact` and `POST /api/newsletter` were not implemented. Add them the
same way as reservations (validator → service → controller → route) if/when
those forms are built.

No authentication/admin endpoints exist yet for the same reason — nothing
in the current frontend needs them.

---

## Architecture

```
Controller  →  Service  →  Repository  →  (Phase 1: in-memory array)
                                        →  (Phase 2: database via ORM)
```

- **Controllers** (`src/controllers/`) — parse `req`, call a service, call `sendSuccess`. No business logic.
- **Services** (`src/services/`) — business rules: order pricing, cancellation eligibility, category validation. Depend only on repository *interfaces*, never on the in-memory implementation directly.
- **Repositories** (`src/repositories/`) — the only files that touch storage. Each exports an interface (`MenuRepository`, `OrderRepository`, `ReservationRepository`) and an `InMemory*` implementation of it.
- **Validators** (`src/validators/`) — Zod schemas, applied by the generic `validateRequest` middleware before a controller ever runs.

## Database-readiness (Phase 2 entry point)

To add a real database, only the repository layer changes:

1. Implement `MenuRepository` / `OrderRepository` / `ReservationRepository` against your ORM/driver of choice (e.g. `PrismaMenuRepository`).
2. Swap the exported singleton in each `*.repository.ts` file (`export const menuRepository = new PrismaMenuRepository(...)` instead of `new InMemoryMenuRepository()`).
3. Run `generate-menu-data.js` once more (or a one-time seed script built the same way) to seed the real table from the frontend's current menu — everything downstream (services, controllers, routes, the API contracts documented above) is unchanged.

No controller, service, route, or validator needs to change. `IN-memory` order/reservation IDs are already opaque strings (`ORD-XXXXXXXX` / `RES-XXXXXXXX`) generated at the repository boundary, so switching to DB-generated IDs (UUID, cuid, autoincrement) is also contained entirely to that layer.

# Runway Rascals API

Auth, Neon Postgres (or local JSON), waitlist, level unlocks, and Stripe checkout.

## Setup

```bash
cd server
cp .env.example .env
npm install
npm start
```

API default: `http://127.0.0.1:8787`

## Neon (Postgres)

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string into `DATABASE_URL` in `.env`
3. On boot, the API runs `schema.sql` (`users`, `purchases`, `waitlist`)

Without `DATABASE_URL`, the API falls back to `server/data/*.json` (local only).

## Stripe

Set in `server/.env`:

- `STRIPE_SECRET_KEY` — enables Checkout Sessions per item
- `STRIPE_PUBLISHABLE_KEY` — returned to clients
- `STRIPE_WEBHOOK_SECRET` — verifies `POST /api/stripe/webhook`
- `STRIPE_PAYMENT_LINK` — optional shared Payment Link fallback

Webhook endpoint: `{API_URL}/api/stripe/webhook`  
Events: `checkout.session.completed` (grants `metadata.itemId` to `metadata.userId`)

Success page also calls `POST /api/store/confirm-session` with `session_id` as a backup grant.

Without Stripe keys, Boutique uses a local confirm checkout that grants the item (dev only).

## Static game

Serve the repo root (e.g. `python3 -m http.server 8765`) and open `http://127.0.0.1:8765/`.
Set `CLIENT_ORIGIN` to that origin (and your production domain when deployed).

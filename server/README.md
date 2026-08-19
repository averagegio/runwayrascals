# Runway Rascals API

Auth (signup/login), JSON user database, level unlocks, and Stripe checkout.

## Setup

```bash
cd server
cp .env.example .env
npm install
npm start
```

API default: `http://127.0.0.1:8787`

## Stripe

Set in `server/.env`:

- `STRIPE_SECRET_KEY` — enables real Stripe Checkout Sessions per item
- `STRIPE_PUBLISHABLE_KEY` — optional, returned to clients
- `STRIPE_PAYMENT_LINK` — optional shared Payment Link fallback

Without keys, the Boutique uses a **demo checkout** that grants the item after confirm (for local testing).

## Static game

Serve the repo root (e.g. `python3 -m http.server 8765`) and open `http://127.0.0.1:8765/`.

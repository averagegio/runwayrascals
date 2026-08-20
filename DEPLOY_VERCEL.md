# Deploy on Vercel (serverless API + static game)

The game (HTML/JS) and the Express API both deploy from this repo.

## One-time setup

1. Push this branch / merge to `main` (or deploy the branch from Vercel).
2. In [Vercel](https://vercel.com) → your **runwayrascals** project:
   - Confirm the root directory is the repo root (not `server/`).
   - **Settings → Environment Variables** (Production + Preview):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | long random string |
| `STRIPE_SECRET_KEY` | `sk_test_…` or `sk_live_…` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |
| `CLIENT_ORIGIN` | `https://www.rascalrunways.com` |

3. Redeploy after saving env vars.
4. Open `https://www.rascalrunways.com/api/health` — expect JSON with `"ok": true` and `"db": "neon"`.

## Domains

- Site: `www.rascalrunways.com` (already on this project)
- API: **same host** — `/api/*` is serverless (no Railway needed)
- You can ignore `api.rascalrunways.com` or point it at this same Vercel project if you want a separate hostname

## Stripe webhook

Endpoint:

`https://www.rascalrunways.com/api/stripe/webhook`

Event: `checkout.session.completed`

## Local

```bash
# API
cd server && npm start   # http://127.0.0.1:8787

# Static
python3 -m http.server 8765
```

On localhost the client talks to `:8787`. On rascalrunways.com it uses same-origin `/api`.

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const PORT = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || 'runway-rascals-dev-secret';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let stripe = null;
if (STRIPE_SECRET) {
    try {
        stripe = require('stripe')(STRIPE_SECRET);
    } catch (err) {
        console.warn('Stripe init failed:', err.message);
    }
}

const STORE_CATALOG = [
    {
        id: 'street-basics',
        name: 'Nameless Street Pack',
        designer: 'Rascal Runways',
        priceCents: 0,
        currency: 'usd',
        description: 'Starter street clothes — free with every account.',
        color: '#6b7280',
        free: true,
        membersOnly: false
    },
    {
        id: 'balenciaga-logo-tee',
        name: 'Logo Blue Tee',
        designer: 'Balenciaga',
        priceCents: 1299,
        currency: 'usd',
        description: 'Royal blue tee with white logo bars.',
        color: '#1e40af',
        logo: 'balenciaga',
        membersOnly: false
    },
    {
        id: 'ralph-crest-polo',
        name: 'Crest Polo',
        designer: 'Ralph Lauren',
        priceCents: 1499,
        currency: 'usd',
        description: 'Kelly green polo with crest mark.',
        color: '#16a34a',
        logo: 'ralph',
        membersOnly: false
    },
    {
        id: 'rick-drkshdw-tee',
        name: 'DRKSHDW Tee',
        designer: 'Rick Owens',
        priceCents: 1199,
        currency: 'usd',
        description: 'Black tee with RO mark.',
        color: '#262626',
        logo: 'rick',
        membersOnly: false
    },
    {
        id: 'balenciaga-triple',
        name: 'Balenciaga Triple-S',
        designer: 'Balenciaga',
        priceCents: 2299,
        currency: 'usd',
        description: 'Chunky red / blue / cream stack sneaker. Members.',
        color: '#ef4444',
        logo: 'balenciaga',
        membersOnly: true
    },
    {
        id: 'rick-ramones',
        name: 'Rick Owens Ramones',
        designer: 'Rick Owens',
        priceCents: 2499,
        currency: 'usd',
        description: 'Black high-top with cream sole. Members.',
        color: '#111111',
        logo: 'rick',
        membersOnly: true
    },
    {
        id: 'casablanca-silk',
        name: 'Casablanca Silk Shirt',
        designer: 'Casablanca',
        priceCents: 1799,
        currency: 'usd',
        description: 'Cream silk club shirt with crest. Members.',
        color: '#f5f0e6',
        logo: 'casablanca',
        membersOnly: true
    },
    {
        id: 'dior-book-tote',
        name: 'Dior Book Tote',
        designer: 'Dior',
        priceCents: 2499,
        currency: 'usd',
        description: 'Navy & cream tote — runway finale. Members.',
        color: '#1e3a5f',
        logo: 'dior',
        membersOnly: true
    },
    {
        id: 'set-balenciaga',
        name: 'Concrete Logo Set',
        designer: 'Balenciaga',
        priceCents: 3499,
        currency: 'usd',
        description: 'Full Berlin look — logo tee + Triple-S. Members.',
        color: '#1d4ed8',
        logo: 'balenciaga',
        setId: 'balenciaga-concrete',
        membersOnly: true
    },
    {
        id: 'set-rick',
        name: 'DRKSHDW Set',
        designer: 'Rick Owens',
        priceCents: 3299,
        currency: 'usd',
        description: 'Drop-crotch + Ramones full look. Members.',
        color: '#111111',
        logo: 'rick',
        setId: 'rick-drkshdw',
        membersOnly: true
    },
    {
        id: 'set-casablanca',
        name: 'Silk Club Set',
        designer: 'Casablanca',
        priceCents: 3199,
        currency: 'usd',
        description: 'Cream silk club look. Members.',
        color: '#0f3d2e',
        logo: 'casablanca',
        setId: 'casablanca-silk',
        membersOnly: true
    },
    {
        id: 'set-ralph',
        name: 'Polo Crest Set',
        designer: 'Ralph Lauren',
        priceCents: 2999,
        currency: 'usd',
        description: 'Crest polo full look. Members.',
        color: '#16a34a',
        logo: 'ralph',
        setId: 'ralph-polo-green',
        membersOnly: true
    },
    {
        id: 'set-dior',
        name: 'Book Tote Set',
        designer: 'Dior',
        priceCents: 3599,
        currency: 'usd',
        description: 'Book Tote + bar jacket polish. Members.',
        color: '#1e3a5f',
        logo: 'dior',
        setId: 'dior-book-tote',
        membersOnly: true
    }
];

const LEVEL_ORDER = ['newyork', 'milan', 'paris', 'london', 'berlin', 'miami'];

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN, credentials: true }));

function signToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '14d' });
}

async function authRequired(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await db.findUserById(payload.sub);
        if (!user) return res.status(401).json({ error: 'Invalid session' });
        req.user = db.publicUser(user);
        req.userId = user.id;
        next();
    } catch (_) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }
}

async function grantFromCheckoutSession(session) {
    const userId = session.metadata && session.metadata.userId;
    const itemId = session.metadata && session.metadata.itemId;
    if (!userId || !itemId) {
        console.warn('Stripe session missing metadata', session.id);
        return null;
    }
    if (session.payment_status && session.payment_status !== 'paid' && session.status !== 'complete') {
        return null;
    }
    return db.addOwnedItem(userId, itemId, { stripeSessionId: session.id });
}

// Webhook must receive the raw body — register before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
    }

    let event = req.body;
    if (STRIPE_WEBHOOK_SECRET) {
        const signature = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        try {
            event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
                ? JSON.parse(req.body.toString('utf8'))
                : req.body;
        } catch (_) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
        console.warn('STRIPE_WEBHOOK_SECRET unset — webhook is unverified (dev only)');
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await grantFromCheckoutSession(session);
        }
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        db: db.backend(),
        stripeConfigured: Boolean(stripe),
        stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
        publishableKey: STRIPE_PUBLISHABLE || null
    });
});

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, displayName, gamerTag } = req.body || {};
        const user = await db.createUser({ email, password, displayName, gamerTag });
        const token = signToken(user);
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Signup failed' });
    }
});

app.post('/api/waitlist', async (req, res) => {
    try {
        const { name, email } = req.body || {};
        const { entry, alreadyJoined } = await db.addWaitlistEntry({ name, email });
        res.status(alreadyJoined ? 200 : 201).json({
            ok: true,
            alreadyJoined,
            entry: { id: entry.id, name: entry.name, email: entry.email, createdAt: entry.createdAt }
        });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Waitlist signup failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const user = await db.verifyLogin(email, password);
        const token = signToken(user);
        res.json({ token, user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Login failed' });
    }
});

app.get('/api/me', authRequired, (req, res) => {
    res.json({ user: req.user });
});

app.patch('/api/me', authRequired, async (req, res) => {
    try {
        const user = await db.updateProfile(req.userId, req.body || {});
        res.json({ user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Update failed' });
    }
});

app.get('/api/store', (_req, res) => {
    res.json({
        items: STORE_CATALOG,
        stripe: {
            configured: Boolean(stripe),
            publishableKey: STRIPE_PUBLISHABLE || null,
            paymentLink: STRIPE_PAYMENT_LINK || null,
            webhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET)
        }
    });
});

app.post('/api/store/checkout', authRequired, async (req, res) => {
    try {
        const { itemId, successUrl, cancelUrl } = req.body || {};
        const item = STORE_CATALOG.find((i) => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (item.free || item.priceCents === 0) {
            const user = await db.addOwnedItem(req.userId, item.id);
            return res.json({ free: true, user });
        }

        if (stripe) {
            const origin = CLIENT_ORIGIN === '*' ? 'http://127.0.0.1:8765' : CLIENT_ORIGIN;
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                customer_email: req.user.email,
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: item.currency,
                            unit_amount: item.priceCents,
                            product_data: {
                                name: item.name,
                                description: `${item.designer} — ${item.description}`,
                                metadata: { itemId: item.id, userId: req.userId }
                            }
                        }
                    }
                ],
                metadata: { itemId: item.id, userId: req.userId },
                success_url:
                    successUrl ||
                    `${origin}/store.html?success=1&item=${item.id}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || `${origin}/store.html?canceled=1`
            });
            return res.json({ url: session.url, sessionId: session.id });
        }

        if (STRIPE_PAYMENT_LINK) {
            return res.json({
                url: STRIPE_PAYMENT_LINK,
                fallback: 'payment_link'
            });
        }

        return res.json({
            url: `/checkout.html?item=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&price=${item.priceCents}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Checkout failed' });
    }
});

/** Confirm a paid Stripe Checkout Session (success-page backup if webhook is delayed). */
app.post('/api/store/confirm-session', authRequired, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(400).json({ error: 'Stripe not configured' });
        }
        const { sessionId } = req.body || {};
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.metadata && session.metadata.userId && session.metadata.userId !== req.userId) {
            return res.status(403).json({ error: 'Session does not belong to this user' });
        }
        if (session.payment_status !== 'paid') {
            return res.status(402).json({ error: 'Payment not completed', paymentStatus: session.payment_status });
        }
        const user = await grantFromCheckoutSession(session);
        res.json({ user, sessionId: session.id });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || 'Confirm session failed' });
    }
});

app.post('/api/store/confirm-checkout', authRequired, async (req, res) => {
    try {
        const { itemId } = req.body || {};
        const item = STORE_CATALOG.find((i) => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (stripe) {
            return res.status(400).json({ error: 'Confirm checkout is only available without Stripe keys' });
        }
        const user = await db.addOwnedItem(req.userId, item.id);
        res.json({ user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Confirm failed' });
    }
});

app.post('/api/store/confirm-demo', authRequired, async (req, res) => {
    try {
        const { itemId } = req.body || {};
        const item = STORE_CATALOG.find((i) => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (stripe) {
            return res.status(400).json({ error: 'Confirm checkout is only available without Stripe keys' });
        }
        const user = await db.addOwnedItem(req.userId, item.id);
        res.json({ user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Confirm failed' });
    }
});

app.post('/api/levels/unlock-next', authRequired, async (req, res) => {
    try {
        const { completedLevelId } = req.body || {};
        const idx = LEVEL_ORDER.indexOf(completedLevelId);
        if (idx < 0) return res.status(400).json({ error: 'Unknown level' });
        const next = LEVEL_ORDER[idx + 1] || null;
        if (!next) {
            return res.json({ user: req.user, newlyUnlocked: null, message: 'All Fashion Week cities unlocked' });
        }
        const result = await db.unlockLevel(req.userId, next);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Unlock failed' });
    }
});

app.get('/api/levels', authRequired, (req, res) => {
    res.json({
        order: LEVEL_ORDER,
        unlocked: req.user.unlockedLevels || ['newyork']
    });
});

async function start() {
    try {
        await db.ensureStore();
    } catch (err) {
        console.error('Database init failed:', err.message);
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`Rascal Runways API on http://127.0.0.1:${PORT}`);
        console.log(`DB backend: ${db.backend()}`);
        console.log(`Stripe Checkout: ${stripe ? 'enabled' : 'confirm-checkout / payment-link mode'}`);
        console.log(`Stripe Webhook: ${STRIPE_WEBHOOK_SECRET ? 'signed' : 'unsigned / missing secret'}`);
    });
}

module.exports = app;

if (require.main === module) {
    start();
}

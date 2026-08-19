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

let stripe = null;
if (STRIPE_SECRET) {
    try {
        stripe = require('stripe')(STRIPE_SECRET);
    } catch (err) {
        console.warn('Stripe init failed:', err.message);
    }
}

db.ensureStore();

const STORE_CATALOG = [
    {
        id: 'street-basics',
        name: 'Nameless Street Pack',
        designer: 'Runway Rascals',
        priceCents: 0,
        currency: 'usd',
        description: 'Starter street clothes — free with every account.',
        color: '#6b7280',
        free: true
    },
    {
        id: 'set-balenciaga',
        name: 'Concrete Logo Set',
        designer: 'Balenciaga',
        priceCents: 3499,
        currency: 'usd',
        description: 'Royal blue logo tee + Triple-S stack — full Berlin look.',
        color: '#1d4ed8',
        setId: 'balenciaga-concrete'
    },
    {
        id: 'balenciaga-logo-tee',
        name: 'Logo Blue Tee',
        designer: 'Balenciaga',
        priceCents: 1299,
        currency: 'usd',
        description: 'Oversized royal blue tee with white back mark.',
        color: '#1e40af'
    },
    {
        id: 'balenciaga-triple',
        name: 'Balenciaga Triple-S',
        designer: 'Balenciaga',
        priceCents: 2299,
        currency: 'usd',
        description: 'Chunky red / blue / cream stack sneaker.',
        color: '#ef4444'
    },
    {
        id: 'set-rick',
        name: 'DRKSHDW Set',
        designer: 'Rick Owens',
        priceCents: 3299,
        currency: 'usd',
        description: 'Drop-crotch black + Ramones cream sole — full Owens look.',
        color: '#111111',
        setId: 'rick-drkshdw'
    },
    {
        id: 'rick-ramones',
        name: 'Rick Owens Ramones',
        designer: 'Rick Owens',
        priceCents: 2499,
        currency: 'usd',
        description: 'Black high-top with oversized cream toe.',
        color: '#111111'
    },
    {
        id: 'rick-drop-pants',
        name: 'Drop-Crotch Pants',
        designer: 'Rick Owens',
        priceCents: 1599,
        currency: 'usd',
        description: 'Black prisoner pant with long cream drawstrings.',
        color: '#0a0a0a'
    },
    {
        id: 'set-casablanca',
        name: 'Silk Club Set',
        designer: 'Casablanca',
        priceCents: 3199,
        currency: 'usd',
        description: 'Cream silk club shirt with navy & emerald trim.',
        color: '#0f3d2e',
        setId: 'casablanca-silk'
    },
    {
        id: 'casablanca-silk',
        name: 'Casablanca Silk Shirt',
        designer: 'Casablanca',
        priceCents: 1799,
        currency: 'usd',
        description: 'Cream silk camp shirt with crest back graphic.',
        color: '#f5f0e6'
    },
    {
        id: 'set-ralph',
        name: 'Polo Crest Set',
        designer: 'Ralph Lauren',
        priceCents: 2999,
        currency: 'usd',
        description: 'Kelly green crest polo with navy & yellow slash.',
        color: '#16a34a',
        setId: 'ralph-polo-green'
    },
    {
        id: 'ralph-crest-polo',
        name: 'Crest Polo',
        designer: 'Ralph Lauren',
        priceCents: 1499,
        currency: 'usd',
        description: 'Kelly green polo — navy collar, polo-player graphic.',
        color: '#16a34a'
    },
    {
        id: 'set-dior',
        name: 'Book Tote Set',
        designer: 'Dior',
        priceCents: 3599,
        currency: 'usd',
        description: 'Navy oblique Book Tote + bar jacket polish.',
        color: '#1e3a5f',
        setId: 'dior-book-tote'
    },
    {
        id: 'dior-book-tote',
        name: 'Dior Book Tote',
        designer: 'Dior',
        priceCents: 2499,
        currency: 'usd',
        description: 'Navy & cream embroidered tote — runway finale piece.',
        color: '#1e3a5f'
    },
    {
        id: 'prada-nylon',
        name: 'Prada Nylon Bag',
        designer: 'Prada',
        priceCents: 1999,
        currency: 'usd',
        description: 'Milan essential. Unlocks nylon finale piece.',
        color: '#166534'
    },
    {
        id: 'mcqueen-skull',
        name: 'McQueen Skull Clutch',
        designer: 'Alexander McQueen',
        priceCents: 2199,
        currency: 'usd',
        description: 'London savage beauty accessory.',
        color: '#9f1239'
    },
    {
        id: 'versace-baroque',
        name: 'Versace Baroque Print',
        designer: 'Versace',
        priceCents: 1899,
        currency: 'usd',
        description: 'Miami Art Deco heat — gold baroque top.',
        color: '#f59e0b'
    }
];

const LEVEL_ORDER = ['newyork', 'milan', 'paris', 'london', 'berlin', 'miami'];

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

function signToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '14d' });
}

function authRequired(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db.findUserById(payload.sub);
        if (!user) return res.status(401).json({ error: 'Invalid session' });
        req.user = db.publicUser(user);
        req.userId = user.id;
        next();
    } catch (_) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }
}

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        stripeConfigured: Boolean(stripe),
        publishableKey: STRIPE_PUBLISHABLE || null
    });
});

app.post('/api/signup', (req, res) => {
    try {
        const { email, password, displayName, gamerTag } = req.body || {};
        const user = db.createUser({ email, password, displayName, gamerTag });
        const token = signToken(user);
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Signup failed' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body || {};
        const user = db.verifyLogin(email, password);
        const token = signToken(user);
        res.json({ token, user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Login failed' });
    }
});

app.get('/api/me', authRequired, (req, res) => {
    res.json({ user: req.user });
});

app.patch('/api/me', authRequired, (req, res) => {
    try {
        const user = db.updateProfile(req.userId, req.body || {});
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
            paymentLink: STRIPE_PAYMENT_LINK || null
        }
    });
});

app.post('/api/store/checkout', authRequired, async (req, res) => {
    try {
        const { itemId, successUrl, cancelUrl } = req.body || {};
        const item = STORE_CATALOG.find((i) => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (item.free || item.priceCents === 0) {
            const user = db.addOwnedItem(req.userId, item.id);
            return res.json({ free: true, user });
        }

        // Prefer Stripe Checkout Session
        if (stripe) {
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
                success_url: successUrl || `${CLIENT_ORIGIN}/store.html?success=1&item=${item.id}`,
                cancel_url: cancelUrl || `${CLIENT_ORIGIN}/store.html?canceled=1`
            });
            return res.json({ url: session.url, sessionId: session.id });
        }

        // Fallback: Stripe Payment Link (shared) or demo checkout URL
        if (STRIPE_PAYMENT_LINK) {
            return res.json({
                url: STRIPE_PAYMENT_LINK,
                fallback: 'payment_link',
                note: 'Using shared Stripe Payment Link. Set STRIPE_SECRET_KEY for per-item Checkout.'
            });
        }

        // Demo mode: grant item after "fake" checkout confirmation page
        return res.json({
            demo: true,
            url: `/store-demo-checkout.html?item=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&price=${item.priceCents}`,
            note: 'Stripe keys not configured. Demo checkout will grant the item locally after confirm.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Checkout failed' });
    }
});

app.post('/api/store/confirm-demo', authRequired, (req, res) => {
    try {
        const { itemId } = req.body || {};
        const item = STORE_CATALOG.find((i) => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (stripe) {
            return res.status(400).json({ error: 'Demo confirm disabled while Stripe is configured' });
        }
        const user = db.addOwnedItem(req.userId, item.id);
        res.json({ user });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Confirm failed' });
    }
});

app.post('/api/levels/unlock-next', authRequired, (req, res) => {
    try {
        const { completedLevelId } = req.body || {};
        const idx = LEVEL_ORDER.indexOf(completedLevelId);
        if (idx < 0) return res.status(400).json({ error: 'Unknown level' });
        const next = LEVEL_ORDER[idx + 1] || null;
        if (!next) {
            return res.json({ user: req.user, newlyUnlocked: null, message: 'All Fashion Week cities unlocked' });
        }
        const result = db.unlockLevel(req.userId, next);
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

// Stripe webhook (optional) — grants item on completed checkout
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    res.json({ received: true });
});

app.listen(PORT, () => {
    console.log(`Runway Rascals API on http://127.0.0.1:${PORT}`);
    console.log(`Stripe Checkout: ${stripe ? 'enabled' : 'demo / payment-link mode'}`);
});

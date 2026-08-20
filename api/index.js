/**
 * Vercel Serverless entry — Express app handles /api/*
 * Set env vars in the Vercel project: DATABASE_URL, JWT_SECRET,
 * STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_ORIGIN, etc.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const db = require('../server/db');
const app = require('../server/index');

let ready = null;
function ensureReady() {
    if (!ready) {
        ready = db.ensureStore().catch((err) => {
            ready = null;
            throw err;
        });
    }
    return ready;
}

async function handler(req, res) {
    await ensureReady();
    return app(req, res);
}

// Let Express parse bodies (needed for Stripe webhook signature verify)
handler.config = {
    api: {
        bodyParser: false
    }
};

module.exports = handler;

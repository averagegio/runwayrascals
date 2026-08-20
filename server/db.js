/**
 * Persistence for Rascal Runways.
 * - DATABASE_URL set  → Neon / Postgres
 * - otherwise         → local JSON files under server/data/
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

const DATABASE_URL = process.env.DATABASE_URL || '';
const useNeon = Boolean(DATABASE_URL);

let pool = null;

function getPool() {
    if (!useNeon) return null;
    if (!pool) {
        const { Pool } = require('pg');
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
            max: 10
        });
    }
    return pool;
}

function mapUserRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        displayName: row.display_name,
        characterName: row.character_name,
        gamerTag: row.gamer_tag,
        unlockedLevels: row.unlocked_levels || ['newyork'],
        ownedItems: row.owned_items || [],
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
}

function normalizeTag(tag) {
    return String(tag || '')
        .trim()
        .replace(/^@+/, '')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);
}

function publicUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        gamerTag: user.gamerTag,
        characterName: user.characterName || user.displayName,
        unlockedLevels: user.unlockedLevels || ['newyork'],
        ownedItems: user.ownedItems || [],
        createdAt: user.createdAt
    };
}

/* ——— JSON fallback helpers ——— */

function ensureJsonFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
    if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, '[]');
    if (!fs.existsSync(WAITLIST_FILE)) fs.writeFileSync(WAITLIST_FILE, '[]');
}

function readJson(file) {
    ensureJsonFiles();
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
    ensureJsonFiles();
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

async function ensureStore() {
    if (useNeon) {
        const p = getPool();
        const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
        await p.query(sql);
        console.log('DB: Neon / Postgres connected (schema ready)');
        return { backend: 'neon' };
    }
    ensureJsonFiles();
    console.log('DB: local JSON (set DATABASE_URL for Neon)');
    return { backend: 'json' };
}

function backend() {
    return useNeon ? 'neon' : 'json';
}

async function findUserByEmail(email) {
    if (useNeon) {
        const { rows } = await getPool().query(
            'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
            [String(email || '')]
        );
        return mapUserRow(rows[0]);
    }
    const users = readJson(USERS_FILE);
    return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

async function findUserById(id) {
    if (useNeon) {
        const { rows } = await getPool().query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        return mapUserRow(rows[0]);
    }
    const users = readJson(USERS_FILE);
    return users.find((u) => u.id === id) || null;
}

async function findUserByTag(tag) {
    const normalized = normalizeTag(tag);
    if (useNeon) {
        const { rows } = await getPool().query(
            'SELECT * FROM users WHERE gamer_tag = $1 LIMIT 1',
            [normalized]
        );
        return mapUserRow(rows[0]);
    }
    const users = readJson(USERS_FILE);
    return users.find((u) => u.gamerTag === normalized) || null;
}

async function createUser({ email, password, displayName, gamerTag }) {
    const emailNorm = String(email).trim().toLowerCase();
    const tag = normalizeTag(gamerTag || displayName);

    if (!emailNorm || !password) {
        const err = new Error('Email and password are required');
        err.status = 400;
        throw err;
    }
    if (password.length < 6) {
        const err = new Error('Password must be at least 6 characters');
        err.status = 400;
        throw err;
    }
    if (!tag || tag.length < 3) {
        const err = new Error('Gamer tag must be at least 3 characters');
        err.status = 400;
        throw err;
    }

    if (await findUserByEmail(emailNorm)) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
    }
    if (await findUserByTag(tag)) {
        const err = new Error('Gamer tag already taken');
        err.status = 409;
        throw err;
    }

    const user = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email: emailNorm,
        passwordHash: bcrypt.hashSync(password, 10),
        displayName: String(displayName || tag).trim().slice(0, 32),
        characterName: String(displayName || tag).trim().slice(0, 32),
        gamerTag: tag,
        unlockedLevels: ['newyork'],
        ownedItems: ['street-basics'],
        createdAt: new Date().toISOString()
    };

    if (useNeon) {
        await getPool().query(
            `INSERT INTO users
             (id, email, password_hash, display_name, character_name, gamer_tag, unlocked_levels, owned_items, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
                user.id,
                user.email,
                user.passwordHash,
                user.displayName,
                user.characterName,
                user.gamerTag,
                user.unlockedLevels,
                user.ownedItems,
                user.createdAt
            ]
        );
        return publicUser(user);
    }

    const users = readJson(USERS_FILE);
    users.push(user);
    writeJson(USERS_FILE, users);
    return publicUser(user);
}

async function verifyLogin(email, password) {
    const user = await findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }
    return publicUser(user);
}

async function updateProfile(userId, patch) {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    if (patch.displayName) user.displayName = String(patch.displayName).trim().slice(0, 32);
    if (patch.characterName) user.characterName = String(patch.characterName).trim().slice(0, 32);
    if (patch.gamerTag) {
        const tag = normalizeTag(patch.gamerTag);
        if (tag.length < 3) {
            const err = new Error('Gamer tag must be at least 3 characters');
            err.status = 400;
            throw err;
        }
        const other = await findUserByTag(tag);
        if (other && other.id !== userId) {
            const err = new Error('Gamer tag already taken');
            err.status = 409;
            throw err;
        }
        user.gamerTag = tag;
    }
    if (Array.isArray(patch.unlockedLevels)) user.unlockedLevels = patch.unlockedLevels;
    if (Array.isArray(patch.ownedItems)) user.ownedItems = patch.ownedItems;

    if (useNeon) {
        await getPool().query(
            `UPDATE users SET
               display_name = $2,
               character_name = $3,
               gamer_tag = $4,
               unlocked_levels = $5,
               owned_items = $6
             WHERE id = $1`,
            [
                userId,
                user.displayName,
                user.characterName,
                user.gamerTag,
                user.unlockedLevels,
                user.ownedItems
            ]
        );
        return publicUser(user);
    }

    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    users[idx] = user;
    writeJson(USERS_FILE, users);
    return publicUser(user);
}

async function unlockLevel(userId, levelId) {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    user.unlockedLevels = user.unlockedLevels || ['newyork'];
    let newlyUnlocked = null;
    if (!user.unlockedLevels.includes(levelId)) {
        user.unlockedLevels.push(levelId);
        newlyUnlocked = levelId;
    }

    if (useNeon) {
        await getPool().query('UPDATE users SET unlocked_levels = $2 WHERE id = $1', [
            userId,
            user.unlockedLevels
        ]);
        return { user: publicUser(user), newlyUnlocked };
    }

    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    users[idx] = user;
    writeJson(USERS_FILE, users);
    return { user: publicUser(user), newlyUnlocked };
}

/**
 * Grant an owned item. Optional stripeSessionId makes grants idempotent.
 */
async function addOwnedItem(userId, itemId, { stripeSessionId = null } = {}) {
    if (useNeon && stripeSessionId) {
        const existing = await getPool().query(
            'SELECT id FROM purchases WHERE stripe_session_id = $1 LIMIT 1',
            [stripeSessionId]
        );
        if (existing.rows[0]) {
            const user = await findUserById(userId);
            return publicUser(user);
        }
    }

    if (!useNeon && stripeSessionId) {
        const purchases = readJson(PURCHASES_FILE);
        if (purchases.some((p) => p.stripeSessionId === stripeSessionId)) {
            const user = await findUserById(userId);
            return publicUser(user);
        }
    }

    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    user.ownedItems = user.ownedItems || [];
    if (!user.ownedItems.includes(itemId)) user.ownedItems.push(itemId);

    const purchase = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        itemId,
        stripeSessionId: stripeSessionId || null,
        at: new Date().toISOString()
    };

    if (useNeon) {
        const client = await getPool().connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE users SET owned_items = $2 WHERE id = $1', [
                userId,
                user.ownedItems
            ]);
            if (stripeSessionId) {
                await client.query(
                    `INSERT INTO purchases (id, user_id, item_id, stripe_session_id, created_at)
                     VALUES ($1,$2,$3,$4,$5)
                     ON CONFLICT (stripe_session_id) DO NOTHING`,
                    [purchase.id, userId, itemId, stripeSessionId, purchase.at]
                );
            } else {
                await client.query(
                    `INSERT INTO purchases (id, user_id, item_id, stripe_session_id, created_at)
                     VALUES ($1,$2,$3,NULL,$4)`,
                    [purchase.id, userId, itemId, purchase.at]
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
        return publicUser(user);
    }

    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    users[idx] = user;
    writeJson(USERS_FILE, users);

    const purchases = readJson(PURCHASES_FILE);
    purchases.push(purchase);
    writeJson(PURCHASES_FILE, purchases);
    return publicUser(user);
}

async function addWaitlistEntry({ name, email }) {
    const nameNorm = String(name || '').trim().slice(0, 80);
    const emailNorm = String(email || '').trim().toLowerCase().slice(0, 160);

    if (!nameNorm || nameNorm.length < 2) {
        const err = new Error('Name is required');
        err.status = 400;
        throw err;
    }
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
        const err = new Error('Valid email is required');
        err.status = 400;
        throw err;
    }

    if (useNeon) {
        const existing = await getPool().query(
            'SELECT id, name, email, created_at FROM waitlist WHERE email = $1 LIMIT 1',
            [emailNorm]
        );
        if (existing.rows[0]) {
            const row = existing.rows[0];
            return {
                entry: {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    createdAt:
                        row.created_at instanceof Date
                            ? row.created_at.toISOString()
                            : row.created_at
                },
                alreadyJoined: true
            };
        }
        const entry = {
            id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: nameNorm,
            email: emailNorm,
            createdAt: new Date().toISOString()
        };
        await getPool().query(
            'INSERT INTO waitlist (id, name, email, created_at) VALUES ($1,$2,$3,$4)',
            [entry.id, entry.name, entry.email, entry.createdAt]
        );
        return { entry, alreadyJoined: false };
    }

    const entries = readJson(WAITLIST_FILE);
    const existing = entries.find((e) => e.email === emailNorm);
    if (existing) {
        return { entry: existing, alreadyJoined: true };
    }

    const entry = {
        id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: nameNorm,
        email: emailNorm,
        createdAt: new Date().toISOString()
    };
    entries.push(entry);
    writeJson(WAITLIST_FILE, entries);
    return { entry, alreadyJoined: false };
}

async function listWaitlist() {
    if (useNeon) {
        const { rows } = await getPool().query(
            'SELECT id, name, email, created_at FROM waitlist ORDER BY created_at DESC'
        );
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            createdAt:
                row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
        }));
    }
    return readJson(WAITLIST_FILE);
}

module.exports = {
    ensureStore,
    backend,
    publicUser,
    findUserById,
    createUser,
    verifyLogin,
    updateProfile,
    unlockLevel,
    addOwnedItem,
    addWaitlistEntry,
    listWaitlist,
    normalizeTag
};

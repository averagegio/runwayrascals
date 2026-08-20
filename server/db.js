const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

function ensureStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
    if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, '[]');
    if (!fs.existsSync(WAITLIST_FILE)) fs.writeFileSync(WAITLIST_FILE, '[]');
}

function readJson(file) {
    ensureStore();
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
    ensureStore();
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
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

function findUserByEmail(email) {
    const users = readJson(USERS_FILE);
    return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserById(id) {
    const users = readJson(USERS_FILE);
    return users.find((u) => u.id === id) || null;
}

function findUserByTag(tag) {
    const normalized = normalizeTag(tag);
    const users = readJson(USERS_FILE);
    return users.find((u) => u.gamerTag === normalized) || null;
}

function createUser({ email, password, displayName, gamerTag }) {
    const users = readJson(USERS_FILE);
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
    if (users.some((u) => u.email === emailNorm)) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
    }
    if (users.some((u) => u.gamerTag === tag)) {
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
    users.push(user);
    writeJson(USERS_FILE, users);
    return publicUser(user);
}

function verifyLogin(email, password) {
    const user = findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }
    return publicUser(user);
}

function updateProfile(userId, patch) {
    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    const user = users[idx];
    if (patch.displayName) user.displayName = String(patch.displayName).trim().slice(0, 32);
    if (patch.characterName) user.characterName = String(patch.characterName).trim().slice(0, 32);
    if (patch.gamerTag) {
        const tag = normalizeTag(patch.gamerTag);
        if (tag.length < 3) {
            const err = new Error('Gamer tag must be at least 3 characters');
            err.status = 400;
            throw err;
        }
        if (users.some((u) => u.gamerTag === tag && u.id !== userId)) {
            const err = new Error('Gamer tag already taken');
            err.status = 409;
            throw err;
        }
        user.gamerTag = tag;
    }
    if (Array.isArray(patch.unlockedLevels)) user.unlockedLevels = patch.unlockedLevels;
    if (Array.isArray(patch.ownedItems)) user.ownedItems = patch.ownedItems;
    users[idx] = user;
    writeJson(USERS_FILE, users);
    return publicUser(user);
}

function unlockLevel(userId, levelId) {
    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    const user = users[idx];
    user.unlockedLevels = user.unlockedLevels || ['newyork'];
    let newlyUnlocked = null;
    if (!user.unlockedLevels.includes(levelId)) {
        user.unlockedLevels.push(levelId);
        newlyUnlocked = levelId;
    }
    users[idx] = user;
    writeJson(USERS_FILE, users);
    return { user: publicUser(user), newlyUnlocked };
}

function addOwnedItem(userId, itemId) {
    const users = readJson(USERS_FILE);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    const user = users[idx];
    user.ownedItems = user.ownedItems || [];
    if (!user.ownedItems.includes(itemId)) user.ownedItems.push(itemId);
    users[idx] = user;
    writeJson(USERS_FILE, users);

    const purchases = readJson(PURCHASES_FILE);
    purchases.push({
        id: `p_${Date.now()}`,
        userId,
        itemId,
        at: new Date().toISOString()
    });
    writeJson(PURCHASES_FILE, purchases);
    return publicUser(user);
}

function addWaitlistEntry({ name, email }) {
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

function listWaitlist() {
    return readJson(WAITLIST_FILE);
}

module.exports = {
    ensureStore,
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

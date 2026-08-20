/** Client auth + API helper for Rascal Runways */
(function (global) {
    function defaultApiBase() {
        try {
            if (typeof location !== 'undefined' && location.protocol && location.protocol !== 'file:') {
                const host = location.hostname || '';
                if (host && host !== 'localhost' && host !== '127.0.0.1') {
                    // Production: same origin (Vercel serverless /api/*)
                    return '';
                }
            }
        } catch (_) { /* ignore */ }
        return 'http://127.0.0.1:8787';
    }

    const DEFAULT_API = defaultApiBase();

    function apiBase() {
        try {
            const saved = localStorage.getItem('apiBase');
            if (saved) return saved.replace(/\/$/, '');
        } catch (_) { /* ignore */ }
        return DEFAULT_API;
    }

    function getToken() {
        return localStorage.getItem('rr_token') || '';
    }

    function setSession(token, user) {
        if (token) localStorage.setItem('rr_token', token);
        if (user) {
            localStorage.setItem('rr_user', JSON.stringify(user));
            if (user.characterName) localStorage.setItem('characterName', user.characterName);
            if (user.gamerTag) localStorage.setItem('gamerTag', user.gamerTag);
            if (user.displayName) localStorage.setItem('displayName', user.displayName);
        }
    }

    function clearSession() {
        localStorage.removeItem('rr_token');
        localStorage.removeItem('rr_user');
    }

    function getCachedUser() {
        try {
            return JSON.parse(localStorage.getItem('rr_user') || 'null');
        } catch (_) {
            return null;
        }
    }

    async function api(path, options = {}) {
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${apiBase()}${path}`, Object.assign({}, options, { headers }));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.error || `Request failed (${res.status})`);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    async function signup(body) {
        const data = await api('/api/signup', { method: 'POST', body: JSON.stringify(body) });
        setSession(data.token, data.user);
        return data.user;
    }

    async function login(body) {
        const data = await api('/api/login', { method: 'POST', body: JSON.stringify(body) });
        setSession(data.token, data.user);
        return data.user;
    }

    async function me() {
        const data = await api('/api/me');
        setSession(getToken(), data.user);
        return data.user;
    }

    async function updateProfile(patch) {
        const data = await api('/api/me', { method: 'PATCH', body: JSON.stringify(patch) });
        setSession(getToken(), data.user);
        return data.user;
    }

    function requireAuth(redirectTo) {
        if (!getToken()) {
            window.location.href = redirectTo || 'login.html';
            return false;
        }
        return true;
    }

    function logout() {
        clearSession();
        window.location.href = 'login.html';
    }

    global.RunwayAuth = {
        apiBase,
        api,
        signup,
        login,
        me,
        updateProfile,
        requireAuth,
        logout,
        getToken,
        getCachedUser,
        setSession,
        clearSession
    };
})(window);

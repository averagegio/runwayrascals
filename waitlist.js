(function () {
  function defaultApiBase() {
    try {
      if (typeof location !== 'undefined' && location.protocol && location.protocol !== 'file:') {
        const host = location.hostname || '';
        if (host && host !== 'localhost' && host !== '127.0.0.1') return '';
      }
    } catch (_) { /* ignore */ }
    return 'http://127.0.0.1:8787';
  }

  function apiBase() {
    try {
      const saved = localStorage.getItem('apiBase');
      if (saved) return saved.replace(/\/$/, '');
    } catch (_) { /* ignore */ }
    return defaultApiBase();
  }

  const form = document.getElementById('waitlistForm');
  const success = document.getElementById('waitlistSuccess');
  const msg = document.getElementById('waitlistMsg');
  const submitBtn = document.getElementById('waitlistSubmit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.classList.remove('is-ok');

    const name = String(document.getElementById('waitlistName').value || '').trim();
    const email = String(document.getElementById('waitlistEmail').value || '').trim();

    if (!name || name.length < 2) {
      msg.textContent = 'Please enter your name.';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = 'Please enter a valid email.';
      return;
    }

    submitBtn.disabled = true;
    const label = submitBtn.querySelector('.btn-text');
    const prev = label ? label.textContent : '';
    if (label) label.textContent = 'Joining…';

    try {
      const res = await fetch(`${apiBase()}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      form.hidden = true;
      success.hidden = false;
    } catch (err) {
      msg.textContent = err.message || 'Could not join waitlist. Try again.';
      submitBtn.disabled = false;
      if (label) label.textContent = prev || 'Join the waitlist';
    }
  });
})();

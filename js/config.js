/* Usuario y API key: solo en localStorage del navegador */
(function (E) {
  const KEY = 'ecos:config';
  E.config = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(c) { localStorage.setItem(KEY, JSON.stringify({ user: c.user.trim(), key: c.key.trim() })); },
    clear() { localStorage.removeItem(KEY); },
    ready() { const c = this.get(); return !!(c.user && c.key); },
  };
})(window.Ecos);

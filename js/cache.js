/* Caché con TTL en localStorage (prefijo ecos:c:) */
(function (E) {
  const P = 'ecos:c:';
  const evict = () => {
    const ks = Object.keys(localStorage).filter((k) => k.startsWith(P));
    ks.map((k) => { try { return [k, JSON.parse(localStorage[k]).t]; } catch { return [k, 0]; } })
      .sort((a, b) => a[1] - b[1]).slice(0, Math.ceil(ks.length / 2)).forEach(([k]) => localStorage.removeItem(k));
  };
  E.cache = {
    get(k, ttl) {
      try { const e = JSON.parse(localStorage.getItem(P + k)); if (e && Date.now() - e.t < ttl * 1000) return e.d; } catch {}
      return null;
    },
    set(k, d) {
      const v = JSON.stringify({ t: Date.now(), d });
      try { localStorage.setItem(P + k, v); } catch { evict(); try { localStorage.setItem(P + k, v); } catch {} }
    },
    clear() { Object.keys(localStorage).filter((k) => k.startsWith(P)).forEach((k) => localStorage.removeItem(k)); },
  };
})(window.Ecos);

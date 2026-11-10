/* Cliente de la API de Last.fm: caché, cola con límite de ritmo, reintentos y errores en español */
(function (E) {
  const BASE = 'https://ws.audioscrobbler.com/2.0/';
  const MIN_GAP = 250; // ms entre peticiones (~4/s, por debajo del límite de Last.fm)
  let last = 0, chain = Promise.resolve();

  class ApiError extends Error {
    constructor(code, msg) { super(msg); this.code = code; }
  }
  const MSG = {
    6: 'No se encontró ese usuario de Last.fm.',
    10: 'La API key no es válida.',
    26: 'La API key está suspendida.',
    29: 'Se alcanzó el límite de peticiones de Last.fm. Espera un minuto e inténtalo de nuevo.',
    17: 'El perfil es privado: Last.fm no permite leer sus datos.',
    network: 'No se pudo conectar con Last.fm. Revisa tu conexión.',
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const slot = () => (chain = chain.then(async () => {
    const d = MIN_GAP - (Date.now() - last); if (d > 0) await wait(d); last = Date.now();
  }));

  async function fetchJson(url, tries = 3) {
    await slot();
    let res;
    try { res = await fetch(url); } catch { throw new ApiError('network', MSG.network); }
    let data = null; try { data = await res.json(); } catch {}
    if (data && data.error) {
      if ([8, 11, 16].includes(data.error) && tries > 1) { await wait(800 * (4 - tries)); return fetchJson(url, tries - 1); }
      throw new ApiError(data.error, MSG[data.error] || data.message || 'Error de Last.fm.');
    }
    if (!res.ok || !data) {
      if (res.status === 429) throw new ApiError(29, MSG[29]);
      if (res.status >= 500 && tries > 1) { await wait(800); return fetchJson(url, tries - 1); }
      throw new ApiError(res.status, 'Respuesta inesperada de Last.fm.');
    }
    return data;
  }

  /* ttl en segundos (0 = sin caché). opts.key permite probar credenciales sin guardarlas */
  E.lastfm = {
    ApiError,
    async call(method, params = {}, { ttl = 300, creds } = {}) {
      const c = creds || E.config.get();
      if (!c.key) throw new ApiError(10, MSG[10]);
      const q = new URLSearchParams({ method, ...params, api_key: c.key, format: 'json' });
      const ck = method + '?' + [...new URLSearchParams({ ...params, u: c.user || '' })].sort().join('&');
      if (ttl) { const hit = E.cache.get(ck, ttl); if (hit) return hit; }
      const data = await fetchJson(BASE + '?' + q);
      if (ttl) E.cache.set(ck, data);
      return data;
    },
    userInfo(creds, ttl = 600) { const c = creds || E.config.get(); return this.call('user.getInfo', { user: c.user }, { ttl, creds }); },
    recent(limit = 15, ttl = 0) { return this.call('user.getRecentTracks', { user: E.config.get().user, limit, extended: 0 }, { ttl }); },
  };
})(window.Ecos);

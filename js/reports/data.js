/* Datos de informes: rangos, descarga de scrobbles por periodo (con nombres) y listas de por vida. Caché en IndexedDB. */
(function (E) {
  const R = (E.reports = E.reports || {});
  const arr = (x) => (x === undefined || x === null ? [] : [].concat(x));

  /* type: week | month | year; offset: 0 = actual, -1 = anterior… (semana de lunes a domingo, hora local) */
  R.range = (type, offset = 0) => {
    const n = new Date(); let s, e;
    if (type === 'week') { s = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7) + offset * 7); e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7); }
    else if (type === 'month') { s = new Date(n.getFullYear(), n.getMonth() + offset, 1); e = new Date(s.getFullYear(), s.getMonth() + 1, 1); }
    else { s = new Date(n.getFullYear() + offset, 0, 1); e = new Date(s.getFullYear() + 1, 0, 1); }
    return { type, offset, start: s, end: e, from: Math.floor(s / 1000), to: Math.floor(e / 1000) - 1, days: Math.round((e - s) / 864e5) };
  };
  R.label = (r) => {
    const f = (d, o) => d.toLocaleDateString('es-ES', o);
    if (r.type === 'year') return String(r.start.getFullYear());
    if (r.type === 'month') return f(r.start, { month: 'long', year: 'numeric' });
    const last = new Date(r.end - 864e5); return `${f(r.start, { day: 'numeric', month: 'short' })} – ${f(last, { day: 'numeric', month: 'short' })}`;
  };

  /* Filas [uts, artista, canción, álbum] de [from,to]. Los periodos pasados se guardan para siempre; el actual, 10 min. */
  R.rows = async (user, from, to, onProgress, maxPages = Infinity) => {
    const key = `rep:${user.toLowerCase()}:${from}:${to}`, now = Date.now() / 1000;
    const c = await E.idb.get(key).catch(() => null);
    if (c && (c.final || Date.now() - c.at < 600000)) { const r = c.rows; r.truncated = !!c.truncated; return r; }
    const rows = []; let p = 1, total = 1, count = 0;
    while (p <= total && p <= maxPages) {
      const d = await E.lastfm.call('user.getRecentTracks', { user, from, to, limit: 200, page: p }, { ttl: 0 });
      const r = d.recenttracks, att = r['@attr'] || {}; total = Number(att.totalPages) || 0; count = Number(att.total) || 0;
      for (const t of arr(r.track)) if (t.date && t.date.uts) rows.push([Number(t.date.uts), t.artist['#text'] || t.artist.name || '', t.name, (t.album && t.album['#text']) || '']);
      onProgress && onProgress(p, total, rows.length, count); p++;
    }
    const truncated = p <= total;
    await E.idb.set(key, { at: Date.now(), final: to < now - 3600 && !truncated, truncated, rows }).catch(() => {});
    rows.truncated = truncated; return rows;
  };

  /* Reproducciones de por vida por elemento (para saber qué es «nuevo»). Mapa clave→conteo; completo si se leyó todo. */
  const LIFE = { artist: ['user.getTopArtists', 'topartists', 'artist', 10], album: ['user.getTopAlbums', 'topalbums', 'album', 20], track: ['user.getTopTracks', 'toptracks', 'track', 25] };
  R.key = { artist: (a) => String(a).toLowerCase(), album: (a, b) => (a + '\u0000' + b).toLowerCase(), track: (a, b) => (a + '\u0000' + b).toLowerCase() };
  R.lifetime = async (user, kind, onProgress) => {
    const key = `life:${user.toLowerCase()}:${kind}`, c = await E.idb.get(key).catch(() => null);
    if (c && Date.now() - c.at < 3 * 3600e3) return { map: new Map(c.entries), complete: c.complete };
    const [method, root, item, cap] = LIFE[kind], map = new Map(); let p = 1, total = 1;
    while (p <= total && p <= cap) {
      const d = await E.lastfm.call(method, { user, period: 'overall', limit: 1000, page: p }, { ttl: 0 });
      const r = d[root]; total = Number((r['@attr'] || {}).totalPages) || 0;
      for (const x of arr(r[item])) map.set(kind === 'artist' ? R.key.artist(x.name) : R.key[kind](x.artist.name, x.name), Number(x.playcount) || 0);
      onProgress && onProgress(kind, p, total); p++;
    }
    const complete = p > total;
    await E.idb.set(key, { at: Date.now(), complete, entries: [...map] }).catch(() => {});
    return { map, complete };
  };
})(window.Ecos);

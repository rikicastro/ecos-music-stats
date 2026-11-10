/* IndexedDB (clave-valor) + historial de scrobbles sincronizado de forma incremental y reanudable */
(function (E) {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open('ecos-db', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  async function kv(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => { const t = db.transaction('kv', mode); const rq = fn(t.objectStore('kv')); t.oncomplete = () => { db.close(); res(rq && rq.result); }; t.onerror = () => rej(t.error); });
  }
  E.idb = { get: (k) => kv('readonly', (s) => s.get(k)), set: (k, v) => kv('readwrite', (s) => s.put(v, k)), del: (k) => kv('readwrite', (s) => s.delete(k)) };

  const key = (u) => 'scrobbles:' + u.toLowerCase();
  const arr = (x) => (x === undefined || x === null ? [] : [].concat(x));

  /* Descarga [from,to] de la más reciente a la más antigua; si se corta, lo bajado es contiguo desde `to` */
  async function fetchRange(user, from, to, signal, onProgress) {
    const out = []; let p = 1, total = 1, error = null;
    while (p <= total && !signal.aborted) {
      let d;
      try { d = await E.lastfm.call('user.getRecentTracks', { user, from, to, limit: 200, page: p }, { ttl: 0 }); }
      catch (e) { error = e; break; }
      const r = d.recenttracks, att = r['@attr'] || {};
      total = Number(att.totalPages) || 0;
      for (const t of arr(r.track)) if (t.date && t.date.uts) out.push(Number(t.date.uts));
      onProgress && onProgress(p, total, out.length, Number(att.total) || 0);
      p++;
    }
    return { uts: out, complete: !error && !signal.aborted && p > total, error };
  }

  E.history = {
    load: async (user) => (await E.idb.get(key(user))) || null,
    clear: (user) => E.idb.del(key(user)),
    /* wantedFrom: unix mínimo deseado (1 = todo el historial). Devuelve {store, error, cancelled} */
    async sync(user, wantedFrom, signal, onProgress) {
      const s = await this.load(user), now = Math.floor(Date.now() / 1000);
      const set = new Set(s ? s.uts : []); let from = s ? s.from : now, syncedTo = s ? s.syncedTo : now, error = null;
      const add = (r) => r.uts.forEach((u) => set.add(u));
      if (!s) {
        const r = await fetchRange(user, wantedFrom, now, signal, onProgress); add(r); error = r.error;
        from = r.complete ? wantedFrom : (r.uts.length ? Math.min(...r.uts) : now);
      } else {
        const r = await fetchRange(user, syncedTo + 1, now, signal, onProgress);
        if (r.complete) { add(r); syncedTo = now; } else error = r.error;
        if (r.complete && wantedFrom < from) {
          const r2 = await fetchRange(user, wantedFrom, from - 1, signal, onProgress); add(r2); error = r2.error;
          from = r2.complete ? wantedFrom : (r2.uts.length ? Math.min(from, ...r2.uts) : from);
        }
      }
      const store = { uts: [...set].sort((a, b) => a - b), from, syncedTo };
      if (store.uts.length || s) await E.idb.set(key(user), store);
      return { store, error, cancelled: signal.aborted };
    },
  };
})(window.Ecos);

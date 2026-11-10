/* Imágenes de artistas, canciones y álbumes. Last.fm ya no las ofrece, así que se buscan en la API pública de Deezer
   (solo se envía el nombre del artista/canción/álbum). Resultados en caché 30 días en localStorage. */
(function (E) {
  const TTL = 30 * 86400, GAP = 140; // ~7 peticiones/s (Deezer permite 50 cada 5 s)
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  let n = 0, chain = Promise.resolve(), last = 0;

  const jsonp = (url) => new Promise((res, rej) => {
    const cb = '__dz' + (n++) + Date.now().toString(36), s = document.createElement('script');
    const done = (v, err) => { clearTimeout(t); delete window[cb]; s.remove(); err ? rej(err) : res(v); };
    const t = setTimeout(() => done(null, new Error('timeout')), 7000);
    window[cb] = (d) => done(d);
    s.onerror = () => done(null, new Error('network'));
    s.src = `${url}&output=jsonp&callback=${cb}`; document.head.appendChild(s);
  });
  const slot = () => (chain = chain.then(() => new Promise((r) => setTimeout(r, Math.max(0, GAP - (Date.now() - last))))).then(() => { last = Date.now(); }));
  const search = async (type, q) => { await slot(); const d = await jsonp(`https://api.deezer.com/search/${type}?q=${encodeURIComponent(q)}&limit=5`); return (d && d.data) || []; };

  const dz = async (path) => { await slot(); const d = await jsonp('https://api.deezer.com/' + path); return (d && d.data) || []; };
  /* Títulos que sabemos de ese artista: la pista del usuario + sus canciones/álbumes más populares en Last.fm */
  async function knownTitles(name, hint) {
    const set = new Set(hint ? [norm(hint)] : []);
    const [tt, ta] = await Promise.all([E.lastfm.call('artist.getTopTracks', { artist: name, limit: 8, autocorrect: 1 }, { ttl: 7 * 86400 }).catch(() => null), E.lastfm.call('artist.getTopAlbums', { artist: name, limit: 8, autocorrect: 1 }, { ttl: 7 * 86400 }).catch(() => null)]);
    [].concat((tt && tt.toptracks && tt.toptracks.track) || [], (ta && ta.topalbums && ta.topalbums.album) || []).forEach((x) => set.add(norm(x.name)));
    set.delete(''); return set;
  }
  async function lookup(kind, name, artist, hint) {
    if (kind === 'artist') {
      const cands = (await search('artist', name)).filter((x) => norm(x.name) === norm(name));
      if (cands.length <= 1) return cands[0] ? cands[0].picture_medium || '' : '';
      // varios artistas con el mismo nombre: elegir el que tenga alguna canción o álbum conocido
      const titles = await knownTitles(name, hint); if (!titles.size) return '';
      const has = (list) => list.some((x) => { const t = norm(x.title); return titles.has(t) || [...titles].some((k) => k.length > 3 && (t.startsWith(k + ' ') || t.endsWith(' ' + k))); });
      for (const c of cands.slice(0, 5)) {
        const [tops, albs] = await Promise.all([dz(`artist/${c.id}/top?limit=50`), dz(`artist/${c.id}/albums?limit=100`)]);
        if (has(tops) || has(albs)) return c.picture_medium || '';
      }
      return '';
    }
    if (kind === 'album') return (await albumCover(artist, name)) || '';
    // canción: varios intentos con el título limpio; si no, la portada de su álbum según Last.fm
    for (const q of queries(artist, name)) {
      const hit = (await search('track', q)).find((x) => sameArtist(x.artist && x.artist.name, artist));
      if (hit && hit.album && hit.album.cover_medium) return hit.album.cover_medium;
    }
    try {
      const d = await E.lastfm.call('track.getInfo', { artist, track: name, autocorrect: 1 }, { ttl: 7 * 86400 }), al = d.track && d.track.album;
      if (al) return E.pickImage(al.image, 'extralarge') || (await albumCover(artist, al.title)) || '';
    } catch {}
    return '';
  }
  const sameArtist = (a, b) => { const x = norm(a), y = norm(b); return !!x && !!y && (x === y || (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x)))); };
  /* Título sin apóstrofos, (feat…), [..] ni sufijos «- Remastered» */
  const clean = (s) => String(s).replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\s+[-–—]\s+.*$/, '').replace(/['’`]/g, '').trim();
  const queries = (artist, name) => [...new Set([`${artist} ${name}`, `${artist} ${clean(name)}`, `${artist} ${String(name).replace(/['’`]/g, '')}`, clean(name) && `${clean(name)} ${artist}`])].filter(Boolean);
  async function albumCover(artist, name) {
    for (const q of [...new Set([`${artist} ${name}`, `${artist} ${clean(name)}`])]) {
      const hit = (await search('album', q)).find((x) => sameArtist(x.artist && x.artist.name, artist));
      if (hit && hit.cover_medium) return hit.cover_medium;
    }
    return '';
  }

  const pending = new Map(); // dedupe de peticiones iguales en vuelo
  E.img = {
    async resolve(kind, name, artist = '', hint = '') {
      const key = `img3:${kind}:${norm(artist)}:${norm(name)}`, hit = E.cache.get(key, TTL);
      if (hit) return hit.u;
      if (pending.has(key)) return pending.get(key);
      const p = lookup(kind, name, artist, hint).then((u) => { E.cache.set(key, { u }); return u; }, () => '').finally(() => pending.delete(key));
      pending.set(key, p); return p;
    },
    /* Rellena las carátulas .cover[data-k] visibles de un contenedor */
    hydrate(root = document) {
      const els = root.querySelectorAll('.cover[data-k]:not([data-done])'); if (!els.length) return;
      const load = async (el) => {
        el.dataset.done = '1';
        const u = await E.img.resolve(el.dataset.k, el.dataset.n, el.dataset.a, el.dataset.h);
        if (!u || !el.isConnected) return;
        const im = new Image(); im.alt = ''; im.onload = () => { el.appendChild(im); el.classList.add('has-img'); }; im.src = u;
      };
      if (!('IntersectionObserver' in window)) return els.forEach(load);
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '300px' });
      els.forEach((el) => io.observe(el));
    },
  };
})(window.Ecos);

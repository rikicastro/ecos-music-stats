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

  async function lookup(kind, name, artist) {
    if (kind === 'artist') {
      const l = await search('artist', name), hit = l.find((x) => norm(x.name) === norm(name));
      return hit ? hit.picture_medium || '' : '';
    }
    if (kind === 'album') {
      const l = await search('album', `${artist} ${name}`), hit = l.find((x) => norm(x.artist && x.artist.name) === norm(artist));
      return hit ? hit.cover_medium || '' : '';
    }
    const l = await search('track', `${artist} ${name}`), hit = l.find((x) => norm(x.artist && x.artist.name) === norm(artist));
    return hit && hit.album ? hit.album.cover_medium || '' : '';
  }

  const pending = new Map(); // dedupe de peticiones iguales en vuelo
  E.img = {
    async resolve(kind, name, artist = '') {
      const key = `img:${kind}:${norm(artist)}:${norm(name)}`, hit = E.cache.get(key, TTL);
      if (hit) return hit.u;
      if (pending.has(key)) return pending.get(key);
      const p = lookup(kind, name, artist).then((u) => { E.cache.set(key, { u }); return u; }, () => '').finally(() => pending.delete(key));
      pending.set(key, p); return p;
    },
    /* Rellena las carátulas .cover[data-k] visibles de un contenedor */
    hydrate(root = document) {
      const els = root.querySelectorAll('.cover[data-k]:not([data-done])'); if (!els.length) return;
      const load = async (el) => {
        el.dataset.done = '1';
        const u = await E.img.resolve(el.dataset.k, el.dataset.n, el.dataset.a);
        if (!u || !el.isConnected) return;
        const im = new Image(); im.alt = ''; im.onload = () => { el.appendChild(im); el.classList.add('has-img'); }; im.src = u;
      };
      if (!('IntersectionObserver' in window)) return els.forEach(load);
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '300px' });
      els.forEach((el) => io.observe(el));
    },
  };
})(window.Ecos);

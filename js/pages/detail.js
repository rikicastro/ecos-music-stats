/* Detalle de artista, canción y álbum */
(function (E) {
  E.pages = E.pages || {};
  const enc = encodeURIComponent, dec = decodeURIComponent;
  const arr = (x) => (x === undefined || x === null ? [] : [].concat(x));
  const tagsHtml = (t) => { const l = arr(t && t.tag).slice(0, 8); return l.length ? `<section class="section"><div class="section-head"><h2>Géneros y etiquetas</h2></div><div class="chips">${l.map((g) => `<span class="chip">${E.esc(g.name)}</span>`).join('')}</div></section>` : ''; };
  const clean = (h) => String(h || '').replace(/<a [^>]*>.*?<\/a>/gis, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  const fmtDur = (ms) => { const s = Math.round(Number(ms) / 1000); return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : ''; };

  function shell(root, { kind, name, sub, subHref, img, stats, body, back }) {
    document.title = name + ' · Ecos';
    root.innerHTML = `<div class="fade-in"><header class="hero"><div class="container">
      ${E.cover(img, name, 'hero-cover')}
      <div><p class="kicker">${kind}</p><h1>${E.esc(name)}</h1>${sub ? `<p class="meta">${subHref ? `<a href="${E.esc(subHref)}">${E.esc(sub)}</a>` : E.esc(sub)}</p>` : ''}</div></div></header>
      <div class="container"><div class="statbar stats">${stats.join('')}</div>${body}<p style="margin-top:40px"><a href="${back}">← Volver</a></p></div></div>`;
  }
  const skel = (root) => { root.innerHTML = `<div class="hero"><div class="container"><div class="cover sk" style="width:140px"></div><div style="flex:1"><div class="sk" style="height:36px;width:240px;max-width:100%"></div></div></div></div><div class="container"><div class="statbar stats">${'<div class="stat"><b class="sk">0000</b><span class="sk">etiqueta</span></div>'.repeat(3)}</div></div>`; };
  const fail = (root, e) => { root.innerHTML = `<div class="container">${E.empty('No se pudo cargar', e.message, '<a class="btn btn-ghost" href="javascript:history.back()">Volver</a>')}</div>`; };
  const miniList = (title, items) => items.length ? `<section class="section"><div class="section-head"><h2>${title}</h2></div><ul class="tracks">${items.join('')}</ul></section>` : '';
  const linkRow = (href, name, sub, img, right = '') => `<li><a class="track" href="${E.esc(href)}">${E.cover(img, name)}<div class="info"><div class="t">${E.esc(name)}</div>${sub ? `<div class="a">${E.esc(sub)}</div>` : ''}</div>${right ? `<time>${E.esc(right)}</time>` : ''}</a></li>`;

  E.pages.artista = async function (root, [name]) {
    const id = E.nav, user = E.config.get().user; skel(root);
    try {
      const p = { artist: name, username: user, autocorrect: 1 };
      const [info, tt, ta] = await Promise.all([E.lastfm.call('artist.getInfo', p, { ttl: 1800 }),
        E.lastfm.call('artist.getTopTracks', { artist: name, limit: 6, autocorrect: 1 }, { ttl: 3600 }).catch(() => null),
        E.lastfm.call('artist.getTopAlbums', { artist: name, limit: 6, autocorrect: 1 }, { ttl: 3600 }).catch(() => null)]);
      if (id !== E.nav) return;
      const a = info.artist, bio = clean(a.bio && a.bio.summary);
      const sim = arr(a.similar && a.similar.artist).slice(0, 8);
      const tracks = arr(tt && tt.toptracks.track).map((t) => linkRow(`#/cancion/${enc(a.name)}/${enc(t.name)}`, t.name, '', E.pickImage(t.image, 'medium'), E.num(t.playcount) + ' repr.'));
      const albums = arr(ta && ta.topalbums.album).map((al) => linkRow(`#/album/${enc(a.name)}/${enc(al.name)}`, al.name, '', E.pickImage(al.image, 'medium'), E.num(al.playcount) + ' repr.'));
      shell(root, { kind: 'Artista', name: a.name, img: E.pickImage(a.image), back: '#/artistas',
        stats: [stat(E.num(a.stats.userplaycount), 'tus reproducciones'), stat(E.num(a.stats.listeners), 'oyentes en Last.fm'), stat(E.num(a.stats.playcount), 'reproducciones globales')],
        body: tagsHtml(a.tags) + (bio ? `<section class="section"><div class="section-head"><h2>Sobre el artista</h2></div><p class="bio">${E.esc(bio)}</p></section>` : '')
          + miniList('Canciones más escuchadas (global)', tracks) + miniList('Álbumes más escuchados (global)', albums)
          + (sim.length ? `<section class="section"><div class="section-head"><h2>Artistas similares</h2></div><div class="chips">${sim.map((s) => `<a class="chip" href="#/artista/${enc(s.name)}">${E.esc(s.name)}</a>`).join('')}</div></section>` : '') });
    } catch (e) { if (id === E.nav) fail(root, e); }
  };

  E.pages.cancion = async function (root, [artist, track]) {
    const id = E.nav, user = E.config.get().user; skel(root);
    try {
      const [info, sim] = await Promise.all([E.lastfm.call('track.getInfo', { artist, track, username: user, autocorrect: 1 }, { ttl: 1800 }),
        E.lastfm.call('track.getSimilar', { artist, track, limit: 8, autocorrect: 1 }, { ttl: 3600 }).catch(() => null)]);
      if (id !== E.nav) return;
      const t = info.track, al = t.album;
      const similar = arr(sim && sim.similartracks && sim.similartracks.track).map((s) => linkRow(`#/cancion/${enc(s.artist.name)}/${enc(s.name)}`, s.name, s.artist.name, E.pickImage(s.image, 'medium')));
      const stats = [stat(E.num(t.userplaycount), 'tus reproducciones'), stat(E.num(t.listeners), 'oyentes en Last.fm'), stat(E.num(t.playcount), 'reproducciones globales')];
      if (fmtDur(t.duration)) stats.push(stat(fmtDur(t.duration), 'duración'));
      shell(root, { kind: 'Canción' + (t.userloved === '1' ? ' · ♥ favorita' : ''), name: t.name, sub: t.artist.name, subHref: `#/artista/${enc(t.artist.name)}`,
        img: al ? E.pickImage(al.image) : '', back: '#/canciones', stats,
        body: (al ? `<section class="section"><div class="section-head"><h2>Álbum</h2></div><ul class="tracks">${linkRow(`#/album/${enc(al.artist || t.artist.name)}/${enc(al.title)}`, al.title, al.artist || '', E.pickImage(al.image, 'medium'))}</ul></section>` : '')
          + tagsHtml(t.toptags) + miniList('Canciones similares', similar) });
    } catch (e) { if (id === E.nav) fail(root, e); }
  };

  E.pages.album = async function (root, [artist, album]) {
    const id = E.nav, user = E.config.get().user; skel(root);
    try {
      const info = await E.lastfm.call('album.getInfo', { artist, album, username: user, autocorrect: 1 }, { ttl: 1800 });
      if (id !== E.nav) return;
      const a = info.album, trs = arr(a.tracks && a.tracks.track);
      const rows = trs.map((t, i) => `<li><a class="track" href="#/cancion/${enc(a.artist)}/${enc(t.name)}"><span class="rank" style="width:28px">${i + 1}</span><div class="info"><div class="t">${E.esc(t.name)}</div></div><time>${E.esc(fmtDur(t.duration * 1000))}</time></a></li>`);
      shell(root, { kind: 'Álbum', name: a.name, sub: a.artist, subHref: `#/artista/${enc(a.artist)}`, img: E.pickImage(a.image), back: '#/albumes',
        stats: [stat(E.num(a.userplaycount), 'tus reproducciones'), stat(E.num(a.listeners), 'oyentes en Last.fm'), stat(E.num(a.playcount), 'reproducciones globales')],
        body: tagsHtml(a.tags) + miniList('Canciones', rows) });
    } catch (e) { if (id === E.nav) fail(root, e); }
  };
})(window.Ecos);

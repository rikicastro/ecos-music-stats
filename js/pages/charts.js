/* Charts: tops por periodo en carruseles con imágenes */
(function (E) {
  E.pages = E.pages || {};
  const enc = encodeURIComponent, esc = E.esc;
  const PER = [['7day', '7 días', 7], ['1month', '30 días', 30], ['12month', '365 días', 365], ['overall', 'Siempre', 0]];
  const SEC = [
    { k: 'artist', t: 'Artistas', m: 'user.getTopArtists', root: 'topartists', route: '#/artistas', sub: () => '', href: (x) => '#/artista/' + enc(x.name), by: () => '' },
    { k: 'album', t: 'Álbumes', m: 'user.getTopAlbums', root: 'topalbums', route: '#/albumes', sub: (x) => x.artist.name, href: (x) => `#/album/${enc(x.artist.name)}/${enc(x.name)}`, by: (x) => x.artist.name },
    { k: 'track', t: 'Canciones', m: 'user.getTopTracks', root: 'toptracks', route: '#/canciones', sub: (x) => x.artist.name, href: (x) => `#/cancion/${enc(x.artist.name)}/${enc(x.name)}`, by: (x) => x.artist.name },
  ];

  E.pages.charts = async function (root) {
    if (!E.config.ready()) { location.hash = '#/ajustes'; return; }
    const id = E.nav, user = E.config.get().user; document.title = 'Charts · Ecos';
    let per = '7day', tk = 0; try { per = localStorage.getItem('ecos:cperiod') || '7day'; } catch {} if (!PER.some((p) => p[0] === per)) per = '7day';
    root.innerHTML = `<div class="container fade-in"><div class="page-head"><div><h1>Charts</h1><p class="muted" id="cs">&nbsp;</p></div>
      <div class="seg" id="pe" role="group" aria-label="Periodo">${PER.map(([v, l]) => `<button class="seg-btn" data-v="${v}" aria-pressed="${v === per}">${l}</button>`).join('')}</div></div><div id="body"></div></div>`;
    const $ = (s) => root.querySelector(s), body = $('#body'), stale = (t) => id !== E.nav || t !== tk;

    async function load() {
      const t = ++tk, meta = PER.find((p) => p[0] === per);
      body.innerHTML = SEC.map((s) => `<section class="section"><div class="section-head head-row"><h2>${s.t}</h2></div><div class="rail">${'<div class="rail-card"><div class="cover sk"></div><div class="sk" style="height:14px;margin-top:10px;width:80%"></div></div>'.repeat(5)}</div></section>`).join('');
      $('#cs').textContent = 'Calculando…';
      (async () => { try {
        let total, days = meta[2];
        if (per === 'overall') { const i = (await E.lastfm.userInfo()).user; total = Number(i.playcount); days = Math.max(1, Math.ceil((Date.now() / 1000 - Number(i.registered.unixtime)) / 86400)); }
        else { const d = await E.lastfm.call('user.getRecentTracks', { user, from: Math.floor(Date.now() / 1000 - days * 86400), limit: 1 }, { ttl: 900 }); total = Number(d.recenttracks['@attr'].total); }
        if (!stale(t)) $('#cs').textContent = `${E.num(total)} reproducciones · media diaria de ${E.num(Math.round(total / days))}`;
      } catch (e) { if (!stale(t)) $('#cs').textContent = ''; } })();
      const res = await Promise.all(SEC.map((s) => E.lastfm.call(s.m, { user, period: per, limit: 12 }, { ttl: 900 }).catch((e) => e)));
      if (stale(t)) return;
      body.innerHTML = SEC.map((s, i) => {
        const r = res[i]; if (r instanceof Error) return `<section class="section"><div class="section-head"><h2>${s.t}</h2></div>${E.empty('No se pudo cargar', r.message)}</section>`;
        const root_ = r[s.root], items = [].concat(root_[s.k] || []), tot = (root_['@attr'] || {}).total;
        return `<section class="section"><div class="section-head head-row"><div><h2>${E.num(tot)} ${s.t}</h2></div><a class="more-link" href="${s.route}" data-per="${per}">Ver más</a></div>
          ${items.length ? `<div class="rail">${items.map((x, n) => `<a class="rail-card ${s.k}" href="${esc(s.href(x))}"><div class="rk">${n + 1}</div>${E.cover(E.pickImage(x.image, 'large'), x.name, '', s.k, s.by(x))}<div class="t">${esc(x.name)}</div><div class="a">${s.sub(x) ? esc(s.sub(x)) + ' · ' : ''}${E.num(x.playcount)} repr.</div></a>`).join('')}</div>` : E.empty('Sin datos', 'No hay reproducciones en este periodo.')}</section>`;
      }).join('');
      E.img.hydrate(body);
      body.querySelectorAll('.more-link').forEach((a) => a.addEventListener('click', () => { try { localStorage.setItem('ecos:period', a.dataset.per); } catch {} }));
    }
    $('#pe').onclick = (e) => { const b = e.target.closest('.seg-btn'); if (!b || b.dataset.v === per) return; per = b.dataset.v; try { localStorage.setItem('ecos:cperiod', per); } catch {} $('#pe').querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', x === b)); load(); };
    load();
  };
})(window.Ecos);

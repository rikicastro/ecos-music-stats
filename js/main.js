(function (E) {
  const ROUTES = [['#/', 'Perfil'], ['#/informes', 'Informes'], ['#/charts', 'Charts'], ['#/actividad', 'Actividad'], ['#/spotify', 'Spotify']];
  const SECTION = { artista: '#/charts', cancion: '#/charts', album: '#/charts', artistas: '#/charts', canciones: '#/charts', albumes: '#/charts' };
  const root = () => document.getElementById('app');

  E.renderNav = function () {
    const hh = location.hash || '#/', cur = SECTION[hh.split('/')[1]] || hh;
    document.getElementById('nav').innerHTML = ROUTES.map(([h, l]) => `<a href="${h}" ${cur === h ? 'aria-current="page"' : ''}>${l}</a>`).join('');
    const c = E.config.get();
    document.getElementById('user').innerHTML = c.user
      ? `<a class="user-chip" href="#/ajustes" aria-label="Ajustes de ${E.esc(c.user)}"><span class="avatar" style="width:26px;height:26px;display:grid;place-items:center;background:var(--accent);color:#14102e;font-weight:800;font-size:13px">${E.esc(c.user[0].toUpperCase())}</span>${E.esc(c.user)}</a>`
      : `<a class="btn btn-primary" href="#/ajustes">Conectar</a>`;
  };

  E.route = function () {
    const h = location.hash || '#/';
    E.nav = (E.nav || 0) + 1; setTimeout(() => { const l = document.getElementById('live'); if (l) l.textContent = document.title; }, 500); E.charts && E.charts.destroyAll(); E.stopTimers && E.stopTimers();
    E.renderNav();
    const el = root(); window.scrollTo(0, 0);
    if (h === '#/ajustes') return E.pages.ajustes(el);
    if (h === '#/') return E.pages.perfil(el);
    if (h === '#/actividad') return E.pages.actividad(el);
    if (h === '#/informes') return E.pages.informes(el);
    if (h === '#/charts') return E.pages.charts(el);
    if (h === '#/spotify') return E.pages.spotify(el);
    const seg = h.split('/').slice(1).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    if (['artistas', 'canciones', 'albumes'].includes(seg[0]) && seg.length === 1) return E.pages.tops(el, seg[0]);
    if (['artista', 'cancion', 'album'].includes(seg[0]) && seg[1]) return E.pages[seg[0]](el, seg.slice(1));
    const r = ROUTES.find((x) => x[0] === h);
    el.innerHTML = `<div class="container">${E.empty(r ? r[1] : 'Página no encontrada', r ? 'Esta sección llega en una próxima fase.' : 'Esa dirección no existe.', '<a class="btn btn-ghost" href="#/">Volver al perfil</a>')}</div>`;
    document.title = (r ? r[1] + ' · ' : '') + 'Ecos';
  };
  window.addEventListener('hashchange', E.route);
  E.route();
})(window.Ecos);

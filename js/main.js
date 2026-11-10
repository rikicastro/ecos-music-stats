(function (E) {
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    actividad: I('<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/>'),
    informes: I('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.6A9 9 0 0 1 20.4 9H15z"/>'),
    charts: I('<path d="M8.5 6H20M8.5 12H20M8.5 18H20M4 6h.01M4 12h.01M4 18h.01"/>'),
    perfil: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
    spotify: I('<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>'),
    lastfm: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>'),
  };
  const NAV = [['#/actividad', 'Actividad', ICON.actividad], ['#/informes', 'Informes', ICON.informes], ['#/charts', 'Charts', ICON.charts]];
  const SECTION = { '': '#/actividad', artista: '#/charts', cancion: '#/charts', album: '#/charts', artistas: '#/charts', canciones: '#/charts', albumes: '#/charts' };
  const root = () => document.getElementById('app');
  const closeMenu = () => { const m = document.getElementById('menu'), b = document.getElementById('um'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); };

  E.renderNav = function () {
    const hh = location.hash || '#/', key = hh.split('/')[1], cur = SECTION[key] || hh;
    document.getElementById('nav').innerHTML = NAV.map(([h, l, ic]) => `<a href="${h}" ${cur === h ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
    const c = E.config.get(), name = c.user || 'Cuenta';
    document.getElementById('user').innerHTML = `<div class="menu-wrap"><button class="user-chip" id="um" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu">
      <span class="avatar" style="width:26px;height:26px;display:grid;place-items:center;background:var(--accent-btn);color:var(--on-accent);font-weight:800;font-size:13px">${E.esc(name[0].toUpperCase())}</span><span class="un">${E.esc(name)}</span>
      <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="menu" id="menu" role="menu" hidden>${c.user ? `<div class="menu-head">Sesión de @${E.esc(c.user)}</div>` : ''}
        <a role="menuitem" href="#/perfil">${ICON.perfil}Perfil</a><a role="menuitem" href="#/spotify">${ICON.spotify}Importar historial de Spotify</a><a role="menuitem" href="#/ajustes">${ICON.lastfm}${c.user ? 'Cambiar cuenta de Last.fm' : 'Conectar con Last.fm'}</a></div></div>`;
  };

  E.route = function () {
    const h = location.hash || '#/';
    E.nav = (E.nav || 0) + 1; setTimeout(() => { const l = document.getElementById('live'); if (l) l.textContent = document.title; }, 500); E.charts && E.charts.destroyAll(); E.stopTimers && E.stopTimers();
    E.renderNav();
    const el = root(); window.scrollTo(0, 0);
    if (h === '#/ajustes') return E.pages.ajustes(el);
    if (h === '#/perfil') return E.pages.perfil(el);
    if (h === '#/' || h === '#/actividad') return E.pages.actividad(el);
    if (h === '#/informes') return E.pages.informes(el);
    if (h === '#/charts') return E.pages.charts(el);
    if (h === '#/spotify') return E.pages.spotify(el);
    const seg = h.split('/').slice(1).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    if (['artistas', 'canciones', 'albumes'].includes(seg[0]) && seg.length === 1) return E.pages.tops(el, seg[0]);
    if (['artista', 'cancion', 'album'].includes(seg[0]) && seg[1]) return E.pages[seg[0]](el, seg.slice(1));
    el.innerHTML = `<div class="container">${E.empty('Página no encontrada', 'Esa dirección no existe.', '<a class="btn btn-ghost" href="#/">Ir al inicio</a>')}</div>`;
    document.title = 'Ecos';
  };
  window.addEventListener('hashchange', E.route);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#um');
    if (b) { const m = document.getElementById('menu'), open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', String(open)); if (open) m.querySelector('a').focus(); return; }
    if (!e.target.closest('#menu')) closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('menu').hidden) { closeMenu(); document.getElementById('um').focus(); } });
  document.getElementById('theme').onclick = () => {
    const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('ecos:theme', dark ? 'dark' : 'light'); } catch {}
    document.querySelector('meta[name=theme-color]').content = dark ? '#0f1319' : '#f4f8fc'; E.route(); // redibuja los gráficos con los colores nuevos
  };
  E.route();
})(window.Ecos);

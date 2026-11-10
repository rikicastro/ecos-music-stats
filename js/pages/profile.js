(function (E) {
  E.pages = E.pages || {};

  const skeleton = `<div class="hero"><div class="container"><div class="avatar sk" style="width:120px;height:120px"></div>
    <div style="flex:1"><div class="sk" style="height:36px;width:220px;max-width:100%"></div><div class="sk" style="height:16px;width:160px;margin-top:12px"></div></div></div></div>
    <div class="container"><div class="statbar stats">${'<div class="stat"><b class="sk">00000</b><span class="sk">etiqueta</span></div>'.repeat(4)}</div></div>`;

  function errorView(root, err) {
    const bad = [6, 10, 26].includes(err.code);
    root.innerHTML = `<div class="container">${E.empty(bad ? 'Revisa tu configuración' : 'No se pudo cargar el perfil', err.message,
      `<a class="btn btn-primary" href="${bad ? '#/ajustes' : '#/perfil'}">${bad ? 'Ir a ajustes' : 'Reintentar'}</a>`)}</div>`;
  }

  E.pages.perfil = async function (root) {
    if (!E.config.ready()) { location.hash = '#/ajustes'; return; }
    const id = E.nav; document.title = 'Perfil · Ecos'; root.innerHTML = skeleton;
    let info;
    try { info = (await E.lastfm.userInfo()).user; } catch (e) { if (id === E.nav) errorView(root, e); return; }
    if (id !== E.nav) return;
    const name = info.realname || info.name;
    const stats = [[info.playcount, 'scrobbles'], [info.artist_count, 'artistas distintos'], [info.track_count, 'canciones distintas'], [info.album_count, 'álbumes distintos']]
      .filter(([v]) => v !== undefined);
    const av = E.pickImage(info.image);
    root.innerHTML = `<div class="fade-in"><header class="hero"><div class="container">
      ${av ? `<img class="avatar" width="120" height="120" src="${E.esc(av)}" alt="Avatar de ${E.esc(info.name)}">` : E.cover('', name, 'avatar').replace('class="cover avatar"', 'class="cover avatar" style="width:120px;height:120px;border-radius:50%;font-size:48px"')}
      <div><h1>${E.esc(name)}${info.realname ? `<small>@${E.esc(info.name)}</small>` : ''}</h1>
      <p class="meta">Escuchando desde el ${E.esc(E.date(info.registered.unixtime))}${info.country && info.country !== 'None' ? ' · ' + E.esc(info.country) : ''}</p>
      <p class="meta"><a href="${E.esc(info.url)}" target="_blank" rel="noopener">Ver perfil en Last.fm ↗</a></p></div></div></header>
      <div class="container"><div class="statbar stats">${stats.map(([v, l]) => `<div class="stat"><b>${E.num(v)}</b><span>${l}</span></div>`).join('')}</div></div></div>`;
  };
})(window.Ecos);

/* Tops: artistas, canciones y álbumes con selector de periodo, barras relativas y "cargar más" */
(function (E) {
  E.pages = E.pages || {};
  const PERIODS = [['1month', '4 semanas'], ['3month', '3 meses'], ['6month', '6 meses'], ['12month', '12 meses'], ['overall', 'Siempre']];
  const enc = encodeURIComponent;
  const TYPES = {
    artistas: { method: 'user.getTopArtists', root: 'topartists', item: 'artist', title: 'Artistas', one: 'artistas distintos',
      view: (a) => ({ name: a.name, sub: '', href: '#/artista/' + enc(a.name) }) },
    canciones: { method: 'user.getTopTracks', root: 'toptracks', item: 'track', title: 'Canciones', one: 'canciones distintas',
      view: (t) => ({ name: t.name, sub: t.artist.name, href: `#/cancion/${enc(t.artist.name)}/${enc(t.name)}` }) },
    albumes: { method: 'user.getTopAlbums', root: 'topalbums', item: 'album', title: 'Álbumes', one: 'álbumes distintos',
      view: (a) => ({ name: a.name, sub: a.artist.name, href: `#/album/${enc(a.artist.name)}/${enc(a.name)}` }) },
  };
  const getPeriod = () => { try { const p = localStorage.getItem('ecos:period'); return PERIODS.some((x) => x[0] === p) ? p : '3month'; } catch { return '3month'; } };
  const rowSk = '<li class="rank-row"><span class="rank sk">00</span><div class="cover sk" style="width:52px"></div><div class="info"><div class="sk" style="height:16px;width:50%"></div><div class="sk" style="height:6px;margin-top:10px"></div></div></li>';

  function rowHtml(cfg, it, i, max) {
    const v = cfg.view(it), pc = Number(it.playcount) || 0, w = max ? Math.max(2, (pc / max) * 100) : 0;
    const img = E.pickImage(it.image, 'large');
    return `<li class="rank-row fade-in"><span class="rank">${i}</span>${E.cover(img, v.name)}
      <a class="info" href="${E.esc(v.href)}"><div class="t">${E.esc(v.name)}</div>${v.sub ? `<div class="a">${E.esc(v.sub)}</div>` : ''}
      <div class="bar" role="img" aria-label="${E.num(pc)} reproducciones"><i style="width:${w.toFixed(1)}%"></i></div></a>
      <div class="plays"><b>${E.num(pc)}</b><span>repr.</span></div></li>`;
  }

  E.pages.tops = async function (root, type) {
    if (!E.config.ready()) { location.hash = '#/ajustes'; return; }
    const id = E.nav, cfg = TYPES[type], user = E.config.get().user;
    let period = getPeriod(), page = 1, count = 0, max = 0;
    document.title = cfg.title + ' · Ecos';
    root.innerHTML = `<div class="container fade-in"><div class="page-head"><div><h1>${cfg.title}</h1><p class="muted" id="sum">&nbsp;</p></div>
      <div class="seg" role="group" aria-label="Periodo">${PERIODS.map(([k, l]) => `<button class="seg-btn" data-p="${k}" aria-pressed="${k === period}">${l}</button>`).join('')}</div></div>
      <ol class="ranking" id="list"></ol><div class="more" id="more"></div></div>`;
    const list = root.querySelector('#list'), more = root.querySelector('#more'), sum = root.querySelector('#sum');

    async function load(reset) {
      if (reset) { page = 1; count = 0; max = 0; list.innerHTML = rowSk.repeat(8); more.innerHTML = ''; }
      let data;
      try { data = await E.lastfm.call(cfg.method, { user, period, limit: 50, page }, { ttl: 900 }); }
      catch (e) { if (id !== E.nav) return; list.innerHTML = `<li>${E.empty('No se pudo cargar', e.message, '<button class="btn btn-primary" id="retry">Reintentar</button>')}</li>`; list.querySelector('#retry').onclick = () => load(reset); return; }
      if (id !== E.nav) return;
      const r = data[cfg.root], items = [].concat(r[cfg.item] || []), att = r['@attr'] || {};
      if (reset) list.innerHTML = '';
      if (!items.length && count === 0) { list.innerHTML = `<li>${E.empty('Sin datos en este periodo', 'Last.fm no tiene reproducciones para este rango. Prueba con otro periodo.')}</li>`; sum.textContent = ''; return; }
      if (!max) max = Number(items[0].playcount) || 1;
      list.insertAdjacentHTML('beforeend', items.map((it) => rowHtml(cfg, it, ++count, max)).join(''));
      sum.textContent = `${E.num(att.total)} ${cfg.one}`;
      const more_ = page < Number(att.totalPages || 1) && count < 500;
      more.innerHTML = more_ ? '<button class="btn btn-ghost" id="m">Cargar más</button>' : '';
      if (more_) more.querySelector('#m').onclick = (ev) => { ev.target.disabled = true; ev.target.textContent = 'Cargando…'; page++; load(false); };
    }
    root.querySelector('.seg').addEventListener('click', (e) => {
      const b = e.target.closest('.seg-btn'); if (!b || b.dataset.p === period) return;
      period = b.dataset.p; try { localStorage.setItem('ecos:period', period); } catch {}
      root.querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', x === b));
      load(true);
    });
    load(true);
  };
})(window.Ecos);

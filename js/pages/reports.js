/* Informes: semana / mes / año comparados con el periodo anterior */
(function (E) {
  E.pages = E.pages || {};
  const R = E.reports, enc = encodeURIComponent, num = E.num, esc = E.esc;
  const NAMES = { week: ['Esta semana', 'Semana anterior', 'semana pasada'], month: ['Este mes', 'Mes anterior', 'mes pasado'], year: ['Este año', 'Año anterior', 'año pasado'] };
  const DOWS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const delta = (a, b, inv) => { const p = R.pct(a, b); if (p === null) return ''; const up = p > 0, cls = p === 0 ? 'flat' : (up !== !!inv) ? 'up' : 'down'; return `<span class="delta ${cls}" aria-label="${up ? 'sube' : 'baja'} ${Math.abs(p)}%">${p === 0 ? '＝' : up ? '▲' : '▼'} ${Math.abs(p)}%</span>`; };
  const fmt1 = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString().replace('.', ',');
  const hlCard = (label, it, href, kind) => it ? `<a class="hl" href="${esc(href)}">${E.cover('', it.name, 'hl-cover', kind, it.artist || '')}<div class="hl-over"><span class="hl-tag">${label}</span><b>${esc(it.name)}</b><span>${it.artist ? esc(it.artist) + ' · ' : ''}${num(it.n)} repr.</span></div></a>` : '';

  function clock(h, prev) {
    const max = Math.max(1, ...h, ...prev), cx = 150, cy = 150, r0 = 46, r1 = 140, P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    const wedge = (i, v, cls) => { if (!v) return ''; const a0 = (i * 15 - 89) * Math.PI / 180, a1 = ((i + 1) * 15 - 91) * Math.PI / 180, r = r0 + (r1 - r0) * v / max;
      return `<path class="${cls}" d="M${P(r0, a0)}L${P(r, a0)}A${r} ${r} 0 0 1 ${P(r, a1)}L${P(r0, a1)}A${r0} ${r0} 0 0 0 ${P(r0, a0)}Z"><title>${i}:00 — ${v}</title></path>`; };
    const lab = [0, 6, 12, 18].map((i) => { const a = (i * 15 - 90) * Math.PI / 180; return `<text x="${(cx + 34 * Math.cos(a)).toFixed(1)}" y="${(cy + 34 * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle">${String(i).padStart(2, '0')}</text>`; }).join('');
    return `<svg class="clock" viewBox="0 0 300 300" role="img" aria-label="Reloj de escucha de 24 horas"><circle cx="150" cy="150" r="140" class="cw-ring"/><circle cx="150" cy="150" r="46" class="cw-ring"/>${prev.map((v, i) => wedge(i, v, 'cw-prev')).join('')}${h.map((v, i) => wedge(i, v, 'cw')).join('')}${lab}</svg>`;
  }

  E.pages.informes = async function (root) {
    if (!E.config.ready()) { location.hash = '#/ajustes'; return; }
    const id = E.nav, user = E.config.get().user; document.title = 'Informes · Ecos'; E.charts.destroyAll();
    let type = 'week', offset = 0, tk = 0; try { type = localStorage.getItem('ecos:rtype') || 'week'; } catch {} if (!NAMES[type]) type = 'week';
    root.innerHTML = `<div class="container fade-in"><div class="page-head"><div><h1>Informes</h1><p class="muted">Tu escucha comparada con el periodo anterior</p></div>
      <div class="seg" id="ty" role="group" aria-label="Tipo de informe">${[['week', 'Semana'], ['month', 'Mes'], ['year', 'Año']].map(([v, l]) => `<button class="seg-btn" data-v="${v}" aria-pressed="${v === type}">${l}</button>`).join('')}</div></div>
      <div class="pager"><button class="btn btn-ghost pg" id="prev" aria-label="Periodo anterior">‹</button><b id="lab"></b><button class="btn btn-ghost pg" id="next" aria-label="Periodo siguiente">›</button></div><div id="body"></div></div>`;
    const $ = (s) => root.querySelector(s), body = $('#body');
    const stale = (t) => id !== E.nav || t !== tk;

    async function load() {
      const t = ++tk, r = R.range(type, offset), q = R.range(type, offset - 1), N = NAMES[type];
      $('#lab').textContent = R.label(r); $('#next').disabled = offset >= 0; E.charts.destroyAll();
      body.innerHTML = '<div class="card prog"><div class="progress"><i style="width:0%"></i></div><p class="muted" id="pt">Cargando…</p></div>';
      const prog = (what) => (p, tot, n, all) => { if (stale(t)) return; const i = body.querySelector('.progress i'); if (i) { i.style.width = (tot ? p / tot * 100 : 100) + '%'; $('#pt').textContent = `${what}: página ${p} de ${tot} · ${num(n)} de ${num(all)} reproducciones`; } };
      let P, Q;
      try { P = await R.rows(user, r.from, r.to, prog('Periodo actual')); if (stale(t)) return; Q = await R.rows(user, q.from, q.to, prog('Periodo anterior')); }
      catch (e) { if (!stale(t)) body.innerHTML = E.empty('No se pudo cargar el informe', e.message, '<button class="btn btn-primary" id="rt">Reintentar</button>'); const b = $('#rt'); if (b) b.onclick = load; return; }
      if (stale(t)) return;
      const a = R.summarize(P, r), bFull = R.summarize(Q, q), cutoff = q.from + (Date.now() / 1000 - r.from);
      // en un periodo en curso se compara con el mismo tramo del anterior (no con el anterior completo)
      const b = a.partial ? Object.assign(R.summarize(Q.filter((x) => x[0] < cutoff), q), { avg: Q.filter((x) => x[0] < cutoff).length / a.elapsed }) : bFull, cur = offset === 0 ? N[0] : R.label(r), pv = offset === 0 ? N[2] : R.label(q);
      if (!a.total) { body.innerHTML = E.empty('Sin reproducciones', 'No hay scrobbles en este periodo.'); return; }
      const labels = type === 'week' ? DOWS : type === 'month' ? Array.from({ length: Math.max(r.days, q.days) }, (_, i) => String(i + 1)) : MONTHS;
      const pad = (s) => labels.map((_, i) => s[i] || 0), cmpNote = a.partial ? 'mismo tramo de la ' : '';
      const peak = a.hours.indexOf(Math.max(...a.hours));
      const stat = (v, l, pvv, inv) => `<div class="card trend"><b>${v}</b><span>${l}</span><small>${pvv}</small></div>`;
      const cnt = (l, x, y) => `<li class="cnt"><b>${num(x)}</b> ${l}<span class="muted">vs. ${num(y)} (${esc(pv)})</span>${delta(x, y)}</li>`;
      const rep = a.repeat.map((x) => `<li><a class="track" href="#/cancion/${enc(x.artist)}/${enc(x.name)}">${E.cover('', x.name, '', 'track', x.artist)}<div class="info"><div class="t">${esc(x.name)}</div><div class="a">${esc(x.artist)} · ${new Date(x.t * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div></div><time>${x.n} en un día</time></a></li>`).join('');
      body.innerHTML = `<div class="fade-in">
        <section class="section" style="margin-top:20px"><h2 class="big">${num(a.total)} reproducciones</h2><p class="muted">vs. ${num(b.total)} (${cmpNote}${esc(pv)}) ${delta(a.total, b.total)}${a.partial ? ' · periodo en curso' : ''}</p>
          <div class="card chart-card" style="margin-top:16px"><canvas id="cs" role="img" aria-label="Reproducciones por ${type === 'week' ? 'día' : type === 'month' ? 'día del mes' : 'mes'}"></canvas></div>
          <p class="legend"><i class="lg lg-a"></i>${esc(cur)} <i class="lg lg-b"></i>${esc(offset === 0 ? N[1] : R.label(q))}</p></section>
        <section class="section"><div class="section-head"><h2>Tendencias</h2><p>Comparado con el periodo anterior</p></div><div class="trends">
          ${stat(num(a.total) + ' ' + delta(a.total, b.total), 'reproducciones', 'antes: ' + num(b.total))}${stat(fmt1(a.avg) + ' ' + delta(a.avg, b.avg), 'media diaria', 'antes: ' + fmt1(b.avg))}${stat(a.active + ' ' + delta(a.active, b.active), 'días con música', 'antes: ' + b.active)}</div></section>
        <section class="section"><div class="section-head"><h2>Lo más escuchado</h2><p>${esc(cur)}</p></div><div class="hls">
          ${hlCard('Artista top', a.tArt[0], '#/artista/' + enc((a.tArt[0] || {}).name), 'artist')}${hlCard('Álbum top', a.tAlb[0], a.tAlb[0] ? `#/album/${enc(a.tAlb[0].artist)}/${enc(a.tAlb[0].name)}` : '', 'album')}${hlCard('Canción top', a.tTrk[0], a.tTrk[0] ? `#/cancion/${enc(a.tTrk[0].artist)}/${enc(a.tTrk[0].name)}` : '', 'track')}</div>
          <ul class="cnts">${cnt('artistas', a.nArt, b.nArt)}${cnt('álbumes', a.nAlb, b.nAlb)}${cnt('canciones', a.nTrk, b.nTrk)}</ul></section>
        <section class="section"><div class="section-head"><h2>Etiquetas populares</h2><p>Según los artistas que más escuchaste</p></div><div id="tg"><div class="sk" style="height:180px"></div></div></section>
        <section class="section"><div class="section-head"><h2>Reloj de escucha</h2><p>Escuchaste más a las ${String(peak).padStart(2, '0')}:00, con ${num(a.hours[peak])} reproducciones.</p></div>
          <div class="card clock-wrap">${clock(a.hours, bFull.hours)}<p class="legend"><i class="lg lg-a"></i>${esc(cur)} <i class="lg lg-b"></i>${esc(offset === 0 ? N[1] : R.label(q))}</p></div></section>
        ${rep ? `<section class="section"><div class="section-head"><h2>En repetición</h2><p>Canciones con más reproducciones en un solo día</p></div><ul class="tracks">${rep}</ul></section>` : ''}
        <section class="section"><div class="section-head"><h2>Descubrimientos</h2><p>Música que escuchaste por primera vez</p></div><div id="dc"><div class="sk" style="height:160px"></div></div></section></div>`;
      E.img.hydrate(body);
      if (E.charts.ready()) { const c = E.charts.bars2($('#cs'), labels, pad(a.series), pad(bFull.series), cur, offset === 0 ? N[1] : R.label(q)); }
      else $('#cs').parentNode.innerHTML = E.empty('Gráficos no disponibles', 'No se pudo cargar Chart.js.');

      R.tags(a.tArt).then((tg) => { if (stale(t)) return; const el = $('#tg'); const m = tg[0] ? tg[0].n : 1;
        el.innerHTML = tg.length ? `<ol class="ranking">${tg.map((x) => `<li class="tagrow"><span class="tg-bar" style="width:${Math.max(8, x.n / m * 100).toFixed(1)}%"></span><span class="tg-n">${esc(x.name)}</span><b>${num(x.n)}</b></li>`).join('')}</ol>` : E.empty('Sin etiquetas', 'No hay etiquetas para estos artistas.'); }).catch(() => {});

      (async () => {
        try {
          const now = Date.now() / 1000, after = r.to < now ? await R.rows(user, r.to + 1, Math.floor(now), null, 20) : [];
          const d = await R.discoveries(user, P, Q, after, (k, p, tot) => { if (!stale(t) && $('#dc')) $('#dc').innerHTML = `<div class="card prog"><p class="muted">Analizando tu historial completo (${k === 'artist' ? 'artistas' : k === 'album' ? 'álbumes' : 'canciones'}, ${p}/${tot})… la primera vez puede tardar.</p></div>`; });
          if (stale(t)) return;
          const names = { artist: 'Artistas nuevos', album: 'Álbumes nuevos', track: 'Canciones nuevas' };
          $('#dc').innerHTML = `<div class="disc">${['artist', 'album', 'track'].map((k) => { const x = d[k], c = x.cur, p = x.prev; if (c.pct === null) return '';
            const items = c.items.slice(0, 3).map((it) => `<li><a class="track" href="${k === 'artist' ? '#/artista/' + enc(it.name) : k === 'album' ? `#/album/${enc(it.artist)}/${enc(it.name)}` : `#/cancion/${enc(it.artist)}/${enc(it.name)}`}">${E.cover('', it.name, '', k, it.artist || '')}<div class="info"><div class="t">${esc(it.name)}</div><div class="a">${it.artist ? esc(it.artist) + ' · ' : ''}${num(it.n)} repr.</div></div></a></li>`).join('');
            return `<div class="card"><b class="pct">${c.pct}%</b> <span>${names[k]}</span><p class="muted small">${num(c.fresh)} de ${num(c.known)} · vs. ${p.pct === null ? '—' : p.pct + '%'} (${esc(pv)}) ${delta(c.pct, p.pct)}${x.approx ? ' · aprox.' : ''}</p><ul class="tracks">${items}</ul></div>`; }).join('')}</div>`;
          E.img.hydrate($('#dc'));
        } catch (e) { if (!stale(t) && $('#dc')) $('#dc').innerHTML = E.empty('No se pudieron calcular los descubrimientos', e.message); }
      })();
    }
    $('#ty').onclick = (e) => { const b = e.target.closest('.seg-btn'); if (!b) return; type = b.dataset.v; offset = 0; try { localStorage.setItem('ecos:rtype', type); } catch {} $('#ty').querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', x === b)); load(); };
    $('#prev').onclick = () => { offset--; load(); };
    $('#next').onclick = () => { if (offset < 0) { offset++; load(); } };
    load();
  };
})(window.Ecos);

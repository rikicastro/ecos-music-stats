/* Actividad: reproducciones por día, mapa de calor, rachas, meses y géneros */
(function (E) {
  E.pages = E.pages || {};
  const enc = encodeURIComponent;
  const SPAN = { 90: 90 * 86400, 365: 365 * 86400, 0: 0 };
  const BLOCK = /seen live|favou?rites?|^love|albums? i own|under \d+ listeners|spotify|my music|^\d{4}s?$|all$|check out|^owned/i;
  const fmtDay = (k) => new Date(k + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const stat = (v, l, extra = '') => `<div class="stat"><b>${v}</b><span>${l}</span>${extra}</div>`;

  function daysSeries(days, n) {
    const labels = [], data = [], d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (n - 1));
    for (let i = 0; i < n; i++) { labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })); data.push(days.get(E.dayKey(d)) || 0); d.setDate(d.getDate() + 1); }
    return { labels, data };
  }
  function monthsSeries(months) {
    const keys = [...months.keys()].sort(); if (!keys.length) return { labels: [], data: [] };
    const out = { labels: [], data: [] }, [y0, m0] = keys[0].split('-').map(Number), now = new Date();
    let y = y0, m = m0; const end = now.getFullYear() * 12 + now.getMonth();
    while (y * 12 + m - 1 <= end) { const k = `${y}-${String(m).padStart(2, '0')}`; out.labels.push(new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })); out.data.push(months.get(k) || 0); if (++m > 12) { m = 1; y++; } }
    const cut = Math.max(0, out.labels.length - 24); out.labels = out.labels.slice(cut); out.data = out.data.slice(cut); return out;
  }

  async function genres(el, id) {
    const user = E.config.get().user;
    try {
      const top = await E.lastfm.call('user.getTopArtists', { user, period: '12month', limit: 30 }, { ttl: 21600 });
      const artists = [].concat(top.topartists.artist || []);
      const tags = await Promise.all(artists.map((a) => E.lastfm.call('artist.getTopTags', { artist: a.name, autocorrect: 1 }, { ttl: 7 * 86400 }).catch(() => null)));
      if (id !== E.nav) return;
      const w = new Map();
      artists.forEach((a, i) => {
        const l = [].concat(tags[i] && tags[i].toptags && tags[i].toptags.tag || []).filter((t) => !BLOCK.test(t.name)).slice(0, 3);
        const sum = l.reduce((s, t) => s + Number(t.count), 0) || 1;
        l.forEach((t) => w.set(t.name.toLowerCase(), (w.get(t.name.toLowerCase()) || 0) + Number(a.playcount) * Number(t.count) / sum));
      });
      const rows = [...w].sort((a, b) => b[1] - a[1]).slice(0, 10), tot = rows.reduce((s, r) => s + r[1], 0);
      el.innerHTML = rows.length ? `<ol class="ranking">${rows.map(([g, v], i) => `<li class="rank-row"><span class="rank">${i + 1}</span><div class="info"><div class="t">${E.esc(g)}</div><div class="bar"><i style="width:${(v / rows[0][1] * 100).toFixed(1)}%"></i></div></div><div class="plays"><b>${(v / tot * 100).toFixed(1).replace('.', ',')}%</b></div></li>`).join('')}</ol>` : E.empty('Sin géneros', 'No hay etiquetas suficientes para tus artistas.');
    } catch (e) { if (id === E.nav) el.innerHTML = E.empty('No se pudieron cargar los géneros', e.message); }
  }

  E.pages.actividad = async function (root) {
    if (!E.config.ready()) { location.hash = '#/ajustes'; return; }
    const id = E.nav, user = E.config.get().user; document.title = 'Actividad · Ecos';
    E.charts.destroyAll();
    let store = null; try { store = await E.history.load(user); } catch {}
    if (id !== E.nav) return;
    const age = store ? Date.now() / 1000 - store.from : 0;
    let range = !store ? '90' : age > 400 * 86400 ? '0' : age > 120 * 86400 ? '365' : '90', span = 30, running = null;

    root.innerHTML = `<div class="container fade-in"><div class="page-head"><div><h1>Actividad</h1><p class="muted" id="cov">Aún no hay historial cargado.</p></div>
      <div class="row-btns"><div class="seg" id="rng" role="group" aria-label="Historial a cargar">${[['90', '90 días'], ['365', '1 año'], ['0', 'Todo']].map(([v, l]) => `<button class="seg-btn" data-r="${v}" aria-pressed="${v === range}">${l}</button>`).join('')}</div>
      <button class="btn btn-primary" id="go">${store ? 'Actualizar' : 'Cargar historial'}</button></div></div>
      <div id="prog" aria-live="polite"></div><div id="out"></div></div>`;
    const $ = (s) => root.querySelector(s), prog = $('#prog'), out = $('#out'), go = $('#go');

    function render() {
      E.charts.destroyAll();
      const uts = store.uts; $('#cov').textContent = `${E.num(uts.length)} scrobbles desde el ${E.date(store.from)} · hasta ${new Date(store.syncedTo * 1000).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}`;
      if (!uts.length) { out.innerHTML = E.empty('Sin reproducciones en este rango', 'Prueba a cargar un periodo más largo.'); return; }
      const a = E.analysis(uts), spanDays = Math.max(1, Math.ceil((Date.now() / 1000 - store.from) / 86400)), mo = monthsSeries(a.months);
      out.innerHTML = `<div class="statbar stats">${stat(E.num(uts.length), 'scrobbles cargados')}${stat(E.num(Math.round(uts.length / Math.min(spanDays, Math.max(1, Math.ceil((Date.now() / 1000 - uts[0]) / 86400))))), 'de media al día')}
        ${stat(a.streak.current + ' d', 'racha actual')}${stat(a.streak.best + ' d', 'racha máxima')}${stat(E.num(a.activeDays), 'días con música')}</div>
        <div class="now fade-in"><div><div class="pill">Tu día más escuchado</div><div class="t">${E.esc(fmtDay(a.topDay[0]))}</div><div class="a">${E.num(a.topDay[1])} reproducciones</div></div></div>
        <section class="section"><div class="section-head head-row"><div><h2>Reproducciones por día</h2><p>Últimos ${span} días</p></div>
          <div class="seg" id="sp" role="group" aria-label="Rango del gráfico">${[30, 90].map((n) => `<button class="seg-btn" data-n="${n}" aria-pressed="${n === span}">${n} días</button>`).join('')}</div></div>
          <div class="card chart-card"><canvas id="cd" role="img" aria-label="Gráfico de reproducciones por día"></canvas></div></section>
        <section class="section"><div class="section-head"><h2>Cuándo escuchas</h2><p>Pico: ${E.DOW[a.peak[0]].toLowerCase()} a las ${String(a.peak[1]).padStart(2, '0')}:00 (${E.num(a.peak[2])} reproducciones)</p></div><div class="card heat-wrap" id="hm"></div></section>
        <section class="section"><div class="section-head"><h2>Tendencia mensual</h2><p>${mo.labels.length < 3 ? 'Carga más historial para ver la tendencia.' : 'El primer mes puede estar incompleto si cargaste solo parte del historial'}</p></div><div class="card chart-card"><canvas id="cm" role="img" aria-label="Gráfico de reproducciones por mes"></canvas></div></section>
        <section class="section"><div class="section-head"><h2>Géneros</h2><p>Según tus 30 artistas más escuchados en los últimos 12 meses</p></div><div id="gn"><div class="sk" style="height:220px"></div></div></section>`;
      E.charts.heatmap($('#hm'), a.heat);
      if (!E.charts.ready()) { out.querySelectorAll('.chart-card').forEach((c) => { c.innerHTML = E.empty('Gráficos no disponibles', 'No se pudo cargar Chart.js (¿sin conexión?).'); }); }
      else {
        const draw = () => { const s = daysSeries(a.days, span); E.charts.destroyAll(); E.charts.bar($('#cd'), s.labels, s.data); E.charts.bar($('#cm'), mo.labels, mo.data, { label: 'Reproducciones' }); };
        draw();
        $('#sp').onclick = (e) => { const b = e.target.closest('.seg-btn'); if (!b) return; span = Number(b.dataset.n); $('#sp').querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', x === b)); out.querySelector('.head-row p').textContent = `Últimos ${span} días`; draw(); };
      }
      genres($('#gn'), id);
    }

    $('#rng').onclick = (e) => { const b = e.target.closest('.seg-btn'); if (!b) return; range = b.dataset.r; $('#rng').querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', x === b)); };
    go.onclick = async () => {
      if (running) { running.aborted = true; return; }
      running = { aborted: false }; go.textContent = 'Cancelar'; go.classList.replace('btn-primary', 'btn-ghost');
      const from = range === '0' ? 1 : Math.floor(Date.now() / 1000 - SPAN[range]);
      prog.innerHTML = '<div class="card prog"><div class="progress"><i style="width:0%"></i></div><p class="muted" id="pt">Conectando con Last.fm…</p></div>';
      const res = await E.history.sync(user, from, running, (p, t, n, tot) => { if (id !== E.nav) { running.aborted = true; return; } const el = prog.querySelector('i'); if (el) { el.style.width = (t ? p / t * 100 : 100) + '%'; $('#pt').textContent = `Página ${p} de ${t} · ${E.num(n)} de ${E.num(tot)} scrobbles`; } });
      running = null; if (id !== E.nav) return;
      go.textContent = 'Actualizar'; go.classList.replace('btn-ghost', 'btn-primary'); store = res.store;
      prog.innerHTML = res.error ? `<div class="msg msg-error">${E.esc(res.error.message)} Se guardó lo descargado; pulsa Actualizar para continuar.</div>` : res.cancelled ? '<div class="msg msg-ok">Carga cancelada. Se guardó lo descargado.</div>' : '';
      if (store.uts.length || store.from) render();
    };
    if (store) render(); else out.innerHTML = E.empty('Carga tu historial', 'Elige cuánto quieres cargar y pulsa «Cargar historial». Se descarga una sola vez y después solo se añaden las novedades.');
  };
})(window.Ecos);

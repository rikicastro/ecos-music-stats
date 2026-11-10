/* Historial de Spotify: importador (arrastrar JSON), datos demo y estadísticas de por vida */
(function (E) {
  E.pages = E.pages || {};
  const S = E.spotify, enc = encodeURIComponent;
  const mins = (ms) => Math.round(ms / 60000);
  const fmtTime = (ms) => { const m = mins(ms), h = m / 60; return h >= 48 ? `${E.num(Math.round(h / 24))} días` : h >= 2 ? `${E.num(Math.round(h))} h` : `${E.num(m)} min`; };
  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  const pct = (a, b) => (b ? (a / b * 100).toFixed(1).replace('.', ',') + '%' : '—');

  E.pages.spotify = async function (root) {
    const id = E.nav; document.title = 'Spotify · Ecos'; E.charts.destroyAll();
    let data = null; try { data = await S.db.get(); } catch {}
    if (id !== E.nav) return;
    let year = 'all', kind = 'art', metric = 'ms';

    const shell = `<div class="container fade-in"><div class="page-head"><div><h1>Historial de Spotify</h1><p class="muted" id="sub"></p></div><div class="row-btns" id="acts"></div></div><div id="msg"></div><div id="body"></div></div>`;
    root.innerHTML = shell;
    const $ = (s) => root.querySelector(s), body = $('#body'), msg = $('#msg');
    const say = (cls, t) => { msg.innerHTML = t ? `<div class="msg ${cls}" role="alert">${E.esc(t)}</div>` : ''; };

    async function importFiles(files) {
      files = [...files].filter((f) => /\.json$/i.test(f.name));
      if (!files.length) return say('msg-error', 'Suelta archivos .json (Streaming_History_Audio_*.json).');
      say('', ''); const prog = document.createElement('div'); prog.className = 'card prog'; prog.innerHTML = '<div class="progress"><i style="width:0%"></i></div><p class="muted" id="pt"></p>'; body.prepend(prog);
      let recs = [], ok = 0; const bad = [];
      for (let i = 0; i < files.length; i++) {
        prog.querySelector('#pt').textContent = `Procesando ${files[i].name} (${i + 1} de ${files.length})…`;
        await new Promise((r) => setTimeout(r, 20));
        try { const r = S.parseText(await files[i].text()); for (const x of r) recs.push(x); ok += r.length ? 1 : 0; if (!r.length) bad.push(`${files[i].name}: sin canciones`); }
        catch (e) { bad.push(`${files[i].name}: ${e.message}`); }
        prog.querySelector('i').style.width = ((i + 1) / files.length * 100) + '%';
      }
      if (!recs.length) { prog.remove(); return say('msg-error', 'No se encontraron reproducciones. ' + bad.join(' · ')); }
      const base = data && data.source === 'import' ? data.records : [];
      const merged = S.merge(base, recs);
      data = { source: 'import', records: merged, importedAt: Date.now(), files: (data && data.source === 'import' ? data.files : 0) + ok };
      await S.db.save(data); year = 'all';
      say(bad.length ? 'msg-error' : 'msg-ok', `Importadas ${E.num(merged.length - base.length)} reproducciones nuevas de ${ok} archivo(s).` + (bad.length ? ' Avisos: ' + bad.join(' · ') : ''));
      draw();
    }

    function acts() {
      $('#acts').innerHTML = data ? `<label class="btn btn-ghost" for="pick" tabindex="0">Añadir archivos</label><button class="btn btn-ghost" id="wipe">Borrar datos</button>` : '';
      const w = $('#wipe'); if (w) w.onclick = async () => { if (!confirm('¿Borrar el historial de Spotify guardado en este navegador? Esta acción no se puede deshacer.')) return; await S.db.clear(); data = null; say('msg-ok', 'Datos borrados.'); draw(); };
    }
    const fileInput = '<input type="file" id="pick" accept=".json,application/json" multiple class="sr-only">';

    function welcome() {
      body.innerHTML = `<label class="drop" id="drop" for="pick" tabindex="0"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
        <b>Arrastra aquí tus archivos <code>Streaming_History_Audio_*.json</code></b><span>o pulsa para elegirlos. Se procesan solo en tu navegador y se guardan en IndexedDB: nada sale de tu equipo.</span></label>${fileInput}
        <div class="card howto"><h2>¿Cómo consigo el historial?</h2><ol><li>Entra en <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener">spotify.com/account/privacy</a>.</li><li>Marca «Historial de streaming extendido» y solicita los datos.</li><li>Spotify te envía un .zip por correo (puede tardar hasta 30 días). Descomprímelo y arrastra aquí los archivos de audio.</li></ol>
        <p class="muted">¿Aún no los tienes? Puedes ver cómo quedaría con datos <b>ficticios</b>:</p><button class="btn btn-ghost" id="demo">Cargar datos de demostración</button></div>`;
      $('#demo').onclick = async () => { data = { source: 'demo', records: S.makeDemo(), importedAt: Date.now(), files: 0 }; await S.db.save(data); say('', ''); draw(); };
    }

    function dashboard() {
      const all = data.records, years = S.years(all), recs = year === 'all' ? all : all.filter((r) => new Date(r.t * 1000).getFullYear() === +year);
      const o = S.summarize(recs), by = S.byYear(all), demo = data.source === 'demo';
      $('#sub').textContent = `${E.num(all.length)} reproducciones · ${E.date(all[0].t)} – ${E.date(all[all.length - 1].t)}`;
      const list = [...(kind === 'art' ? o.art : kind === 'trk' ? o.trk : o.alb).values()].sort((a, b) => (metric === 'ms' ? b.ms - a.ms : b.n - a.n || b.ms - a.ms)).slice(0, 50);
      const top = list.length ? (metric === 'ms' ? list[0].ms : list[0].n) || 1 : 1;
      const href = (e) => kind === 'art' ? '#/artista/' + enc(e.name) : kind === 'trk' ? `#/cancion/${enc(e.artist)}/${enc(e.name)}` : `#/album/${enc(e.artist)}/${enc(e.name)}`;
      const plat = [...o.plat].sort((a, b) => b[1].ms - a[1].ms), ptot = o.ms || 1;
      const seg = (name, items, cur) => `<div class="seg" data-g="${name}" role="group">${items.map(([v, l]) => `<button class="seg-btn" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
      body.innerHTML = `${demo ? '<div class="msg demo" role="note"><b>DATOS DE DEMOSTRACIÓN.</b> Todo lo que ves es ficticio. Importa tus archivos reales para sustituirlo.</div>' : ''}
        <div class="head-row" style="margin-bottom:8px"><p class="muted">Filtrar por año</p>${seg('year', [['all', 'Todos'], ...years.map((y) => [y, y])], year)}</div>
        <div class="statbar stats">${stat(E.num(mins(o.ms)), 'minutos escuchados')}${stat(fmtTime(o.ms), 'tiempo total')}${stat(E.num(o.streams), 'reproducciones (≥30 s)')}${stat(E.num(o.days.size), 'días con música')}${stat(pct(o.skips, o.n), 'saltadas')}${stat(pct(o.shuffle, o.n), 'en modo aleatorio')}</div>
        <section class="section"><div class="section-head head-row"><div><h2>Tops por tiempo</h2><p>${year === 'all' ? 'De toda la vida' : year}</p></div><div class="row-btns">${seg('kind', [['art', 'Artistas'], ['trk', 'Canciones'], ['alb', 'Álbumes']], kind)}${seg('metric', [['ms', 'Minutos'], ['n', 'Reproducciones']], metric)}</div></div>
          <ol class="ranking">${list.map((e, i) => { const v = metric === 'ms' ? e.ms : e.n, w = Math.max(2, v / top * 100);
            return `<li class="rank-row"><span class="rank">${i + 1}</span>${E.cover('', e.name, '', kind === 'art' ? 'artist' : kind === 'trk' ? 'track' : 'album', e.artist || '')}<a class="info" href="${E.esc(href(e))}"><div class="t">${E.esc(e.name)}</div>${e.artist ? `<div class="a">${E.esc(e.artist)}</div>` : ''}<div class="bar"><i style="width:${w.toFixed(1)}%"></i></div></a><div class="plays"><b>${E.num(mins(e.ms))}</b><span>min · ${E.num(e.n)} repr.</span></div></li>`; }).join('') || E.empty('Sin datos', 'No hay reproducciones en este año.')}</ol></section>
        <section class="section"><div class="section-head"><h2>Comparativa por año</h2><p>Minutos escuchados cada año</p></div><div class="card chart-card"><canvas id="cy" role="img" aria-label="Minutos escuchados por año"></canvas></div>
          <div class="card" style="margin-top:12px;overflow-x:auto"><table class="tbl"><thead><tr><th>Año</th><th>Minutos</th><th>Reproducciones</th><th>Artistas distintos</th></tr></thead><tbody>${by.map((y) => `<tr><td>${y.y}</td><td>${E.num(mins(y.ms))}</td><td>${E.num(y.streams)}</td><td>${E.num(y.artists.size)}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="section"><div class="section-head"><h2>Horas pico</h2><p>Minutos escuchados por hora del día</p></div><div class="card chart-card"><canvas id="ch" role="img" aria-label="Minutos por hora del día"></canvas></div></section>
        <section class="section"><div class="section-head"><h2>Cuándo escuchas</h2><p>Reproducciones por día de la semana y hora</p></div><div class="card heat-wrap" id="hm"></div></section>
        <section class="section"><div class="section-head"><h2>Dispositivos y plataformas</h2><p>Reparto del tiempo escuchado</p></div><ol class="ranking">${plat.map(([n, e], i) => `<li class="rank-row"><span class="rank">${i + 1}</span><div class="info"><div class="t">${E.esc(n)}</div><div class="bar"><i style="width:${(e.ms / plat[0][1].ms * 100).toFixed(1)}%"></i></div></div><div class="plays"><b>${pct(e.ms, ptot)}</b><span>${E.num(mins(e.ms))} min</span></div></li>`).join('')}</ol></section>${fileInput}`;
      E.charts.heatmap($('#hm'), o.heat); E.img.hydrate(body);
      if (E.charts.ready()) { E.charts.destroyAll(); E.charts.bar($('#cy'), by.map((y) => y.y), by.map((y) => mins(y.ms)), { label: 'Minutos' }); E.charts.bar($('#ch'), o.hours.map((_, h) => h + ':00'), o.hours.map(Math.round), { label: 'Minutos' }); }
      else body.querySelectorAll('.chart-card').forEach((c) => { c.innerHTML = E.empty('Gráficos no disponibles', 'No se pudo cargar Chart.js.'); });
      body.querySelectorAll('.seg').forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('.seg-btn'); if (!b) return; const v = b.dataset.v, n = g.dataset.g; if (n === 'year') year = v; else if (n === 'kind') kind = v; else metric = v; dashboard(); bind(); }));
    }

    function bind() {
      const pick = $('#pick'), drop = $('#drop');
      if (pick) pick.onchange = () => { importFiles(pick.files); pick.value = ''; };
      if (drop) { drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.click(); } };
        ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
        ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
        drop.addEventListener('drop', (e) => importFiles(e.dataTransfer.files)); }
    }
    function draw() { acts(); if (data) dashboard(); else welcome(); bind(); }
    // arrastrar archivos sobre toda la página también funciona con datos ya cargados
    root.ondragover = (e) => e.preventDefault(); root.ondrop = (e) => { e.preventDefault(); if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); };
    draw();
  };
})(window.Ecos);

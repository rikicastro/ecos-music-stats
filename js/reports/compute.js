/* Cálculo de informes: resumen de un periodo, comparación, en repetición, etiquetas y descubrimientos */
(function (E) {
  const R = E.reports, TAG_BLOCK = /seen live|favou?rites?|^love|albums? i own|under \d+ listeners|spotify|my music|^\d{4}s?$|all$|check out|^owned/i;

  const top = (m, n = 10) => [...m.values()].sort((a, b) => b.n - a.n || (a.name > b.name ? 1 : -1)).slice(0, n);
  function counts(rows) {
    const art = new Map(), alb = new Map(), trk = new Map();
    const add = (m, k, o) => { const e = m.get(k); if (e) e.n++; else m.set(k, { ...o, n: 1 }); };
    for (const [, a, t, al] of rows) {
      add(art, R.key.artist(a), { name: a });
      if (al) add(alb, R.key.album(a, al), { name: al, artist: a });
      add(trk, R.key.track(a, t), { name: t, artist: a });
    }
    return { art, alb, trk };
  }

  /* rows del periodo; r = rango; now en ms */
  R.summarize = (rows, r, now = Date.now()) => {
    const c = counts(rows), nb = r.type === 'week' ? 7 : r.type === 'month' ? r.days : 12;
    const series = Array(nb).fill(0), hours = Array(24).fill(0), dayTrk = new Map(), active = new Set();
    for (const [t, a, tr] of rows) {
      const d = new Date(t * 1000), i = r.type === 'week' ? (d.getDay() + 6) % 7 : r.type === 'month' ? d.getDate() - 1 : d.getMonth();
      if (i >= 0 && i < nb) series[i]++;
      hours[d.getHours()]++;
      const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; active.add(day);
      const k = day + '|' + R.key.track(a, tr), e = dayTrk.get(k); if (e) e.n++; else dayTrk.set(k, { n: 1, name: tr, artist: a, t });
    }
    const elapsed = now < r.end * 1 ? Math.max(1, Math.ceil((now - r.start) / 864e5)) : r.days;
    return { total: rows.length, elapsed, avg: rows.length / elapsed, active: active.size, partial: now < +r.end,
      nArt: c.art.size, nAlb: c.alb.size, nTrk: c.trk.size, tArt: top(c.art), tAlb: top(c.alb), tTrk: top(c.trk), counts: c,
      series, hours, repeat: [...dayTrk.values()].sort((a, b) => b.n - a.n || b.t - a.t).filter((x) => x.n >= 2).slice(0, 5) };
  };
  R.pct = (a, b) => (b ? Math.round((a - b) / b * 100) : null);

  /* Etiquetas populares ponderadas por reproducciones de los artistas más escuchados del periodo */
  R.tags = async (tArt, limit = 12) => {
    const arts = tArt.slice(0, 15), res = await Promise.all(arts.map((a) => E.lastfm.call('artist.getTopTags', { artist: a.name, autocorrect: 1 }, { ttl: 7 * 86400 }).catch(() => null)));
    const w = new Map();
    arts.forEach((a, i) => {
      const l = [].concat((res[i] && res[i].toptags && res[i].toptags.tag) || []).filter((t) => !BLOCK(t.name)).slice(0, 4), sum = l.reduce((s, t) => s + Number(t.count), 0) || 1;
      l.forEach((t) => { const k = t.name.toLowerCase(); w.set(k, (w.get(k) || 0) + a.n * Number(t.count) / sum); });
    });
    return [...w].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, v]) => ({ name, n: Math.round(v) }));
  };
  const BLOCK = (n) => TAG_BLOCK.test(n);

  /* Descubrimientos: elemento nuevo = antes del periodo no tenía reproducciones.
     lifetime == en_periodo + posteriores  ⇔  no había antes. Posteriores = rows de «after» (+ P para evaluar Q). */
  R.discoveries = async (user, P, Q, after, onProgress) => {
    const cP = counts(P), cQ = counts(Q), cA = counts(after), out = {};
    for (const [kind, f] of [['artist', 'art'], ['album', 'alb'], ['track', 'trk']]) {
      const life = await R.lifetime(user, kind, onProgress);
      const calc = (inP, extra) => { let known = 0, fresh = 0; const items = [];
        inP.forEach((e, k) => { const L = life.map.get(k); if (L === undefined) return; known++;
          const ex = extra.reduce((s, m) => s + ((m.get(k) || {}).n || 0), 0);
          if (L <= e.n + ex) { fresh++; items.push(e); } });
        return { pct: known ? Math.round(fresh / known * 100) : null, fresh, known, items: items.sort((a, b) => b.n - a.n).slice(0, 5) }; };
      out[kind] = { cur: calc(cP[f], [cA[f]]), prev: calc(cQ[f], [cP[f], cA[f]]), approx: !life.complete || !!after.truncated };
    }
    return out;
  };
})(window.Ecos);

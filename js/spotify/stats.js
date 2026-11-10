/* Agregados del historial de Spotify */
(function (E) {
  const S = E.spotify, STREAM_MS = 30000; // como Spotify: una reproducción cuenta desde 30 s
  S.STREAM_MS = STREAM_MS;
  S.years = (recs) => [...new Set(recs.map((r) => new Date(r.t * 1000).getFullYear()))].sort();
  S.summarize = (recs) => {
    const o = { n: recs.length, ms: 0, streams: 0, skips: 0, shuffle: 0, first: 0, last: 0, plat: new Map(), hours: Array(24).fill(0), heat: Array.from({ length: 7 }, () => Array(24).fill(0)), art: new Map(), trk: new Map(), alb: new Map(), days: new Set() };
    const add = (m, k, r, extra) => { let e = m.get(k); if (!e) m.set(k, (e = { ms: 0, n: 0, ...extra })); e.ms += r.ms; if (r.ms >= STREAM_MS) e.n++; };
    for (const r of recs) {
      const st = r.ms >= STREAM_MS, d = new Date(r.t * 1000);
      o.ms += r.ms; if (st) o.streams++; o.skips += r.sk; o.shuffle += r.sh;
      if (!o.first || r.t < o.first) o.first = r.t; if (r.t > o.last) o.last = r.t;
      const h = d.getHours(); o.hours[h] += r.ms / 60000; if (st) o.heat[(d.getDay() + 6) % 7][h]++;
      o.days.add(r.t - (r.t % 86400));
      add(o.plat, r.pl, r, {}); add(o.art, r.a, r, { name: r.a });
      add(o.trk, r.a + '\u0000' + r.tr, r, { name: r.tr, artist: r.a });
      if (r.al) add(o.alb, r.a + '\u0000' + r.al, r, { name: r.al, artist: r.a });
    }
    return o;
  };
  S.byYear = (recs) => {
    const m = new Map();
    for (const r of recs) { const y = new Date(r.t * 1000).getFullYear(); const e = m.get(y) || { y, ms: 0, streams: 0, artists: new Set() }; e.ms += r.ms; if (r.ms >= STREAM_MS) e.streams++; e.artists.add(r.a); m.set(y, e); }
    return [...m.values()].sort((a, b) => a.y - b.y);
  };
})(window.Ecos);

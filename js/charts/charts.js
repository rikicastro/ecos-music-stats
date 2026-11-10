/* Análisis de scrobbles y gráficos (Chart.js por CDN + mapa de calor en HTML/CSS) */
(function (E) {
  const pad = (n) => String(n).padStart(2, '0');
  const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dnum = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let live = [];

  E.analysis = function (uts) {
    const days = new Map(), months = new Map(), heat = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const u of uts) {
      const d = new Date(u * 1000), k = dk(d), mk = k.slice(0, 7);
      days.set(k, (days.get(k) || 0) + 1); months.set(mk, (months.get(mk) || 0) + 1);
      heat[(d.getDay() + 6) % 7][d.getHours()]++;
    }
    const keys = [...days.keys()].sort(); let best = 0, cur = 0, run = 0, prev = null;
    for (const k of keys) { const n = dnum(k); run = prev !== null && n === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; }
    const today = dk(new Date()), yest = dk(new Date(Date.now() - 864e5));
    if (days.has(today) || days.has(yest)) { // la racha sigue viva si hay scrobbles hoy o ayer
      let n = dnum(days.has(today) ? today : yest); while (days.has(new Date(n * 864e5).toISOString().slice(0, 10))) { cur++; n--; }
    }
    let top = ['', 0]; days.forEach((v, k) => { if (v > top[1]) top = [k, v]; });
    let pk = [0, 0, 0]; heat.forEach((r, i) => r.forEach((v, h) => { if (v > pk[2]) pk = [i, h, v]; }));
    return { days, months, heat, streak: { current: cur, best }, topDay: top, peak: pk, activeDays: days.size };
  };
  E.dayKey = dk;

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  E.charts = {
    ready: () => !!window.Chart,
    destroyAll() { live.forEach((c) => c.destroy()); live = []; },
    bar(canvas, labels, data, { label = 'Reproducciones', color } = {}) {
      Chart.defaults.font.family = css('--font'); Chart.defaults.color = css('--muted');
      const c = new Chart(canvas, { type: 'bar', data: { labels, datasets: [{ label, data, backgroundColor: color || css('--accent'), borderRadius: 4, maxBarThickness: 22 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#222227', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, padding: 10, displayColors: false } },
          scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.06)' }, border: { display: false }, ticks: { precision: 0 } } } } });
      live.push(c); return c;
    },
    heatmap(el, heat) {
      const max = Math.max(1, ...heat.flat());
      let h = '<div class="heat" role="table" aria-label="Reproducciones por día de la semana y hora"><div class="heat-corner"></div>';
      for (let i = 0; i < 24; i++) h += `<div class="heat-h" aria-hidden="true">${i % 3 === 0 ? i : ''}</div>`;
      heat.forEach((row, d) => {
        h += `<div class="heat-d" role="rowheader">${DOW[d].slice(0, 3)}</div>`;
        row.forEach((v, hr) => { const a = v ? 0.12 + 0.88 * (v / max) : 0; h += `<div class="heat-c" role="cell" title="${DOW[d]} ${pad(hr)}:00 — ${E.num(v)}" aria-label="${DOW[d]} ${hr}h: ${v}" style="--a:${a.toFixed(3)}"></div>`; });
      });
      el.innerHTML = h + '</div>';
    },
  };
  E.DOW = DOW;
})(window.Ecos);

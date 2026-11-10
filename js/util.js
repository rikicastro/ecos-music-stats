/* Utilidades. Espacio de nombres global: window.Ecos */
window.Ecos = window.Ecos || {};
(function (E) {
  E.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
  E.num = (n) => nf.format(Number(n) || 0);
  E.date = (unix) => new Date(unix * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  E.ago = (unix) => {
    const s = Math.max(0, Date.now() / 1000 - unix);
    if (s < 60) return 'ahora mismo';
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
    return E.date(unix);
  };
  // Last.fm devuelve una estrella gris genérica cuando no hay imagen
  const PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';
  E.pickImage = (arr, size = 'extralarge') => {
    const list = Array.isArray(arr) ? arr : [];
    const hit = list.find((i) => i.size === size) || list[list.length - 1];
    const url = hit && hit['#text'];
    return url && !url.includes(PLACEHOLDER) ? url : '';
  };
  E.hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  /* Carátula con inicial de color como alternativa */
  E.cover = (url, name, cls = '') => {
    const ini = E.esc((String(name).trim()[0] || '?').toUpperCase());
    const bg = `background:linear-gradient(135deg,hsl(${E.hue(name)} 45% 38%),hsl(${(E.hue(name) + 40) % 360} 45% 24%))`;
    return `<div class="cover ${cls}" style="${bg}"><span class="ini" aria-hidden="true">${ini}</span>${url ? `<img src="${E.esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
  };
  E.empty = (title, text, action = '') => `<div class="empty fade-in"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 15c1.2-1 2.4-1.5 4-1.5s2.8.5 4 1.5M9 9.5h.01M15 9.5h.01"/></svg><h2>${E.esc(title)}</h2><p>${E.esc(text)}</p>${action}</div>`;
})(window.Ecos);

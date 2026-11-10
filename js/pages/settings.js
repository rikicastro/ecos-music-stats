(function (E) {
  E.pages = E.pages || {};
  E.pages.ajustes = function (root) {
    const c = E.config.get();
    root.innerHTML = `<div class="container narrow fade-in">
      <h1>Conecta tu Last.fm</h1>
      <p class="muted">Tu usuario y tu API key se guardan solo en este navegador (localStorage). No se envían a ningún servidor propio.</p>
      <form class="card" id="f" novalidate>
        <div id="out" role="status"></div>
        <div class="field"><label for="u">Usuario de Last.fm</label>
          <input class="input" id="u" autocomplete="off" autocapitalize="off" spellcheck="false" value="${E.esc(c.user || '')}" required></div>
        <div class="field"><label for="k">API key</label>
          <input class="input" id="k" type="password" autocomplete="off" spellcheck="false" value="${E.esc(c.key || '')}" required>
          <small>Consíguela gratis en <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener">last.fm/api/account/create</a>. Solo necesitas la «API key», no el secreto.</small></div>
        <div class="row-btns"><button class="btn btn-primary" id="save">Comprobar y guardar</button>
          ${E.config.ready() ? '<button type="button" class="btn btn-ghost" id="wipe">Borrar mis datos locales</button>' : ''}</div>
      </form></div>`;
    const out = root.querySelector('#out');
    const show = (cls, t) => { out.innerHTML = `<div class="msg ${cls}" role="alert">${E.esc(t)}</div>`; };
    root.querySelector('#f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = root.querySelector('#u').value.trim(), key = root.querySelector('#k').value.trim();
      if (!user || !key) return show('msg-error', 'Rellena usuario y API key.');
      const btn = root.querySelector('#save'); btn.disabled = true; btn.textContent = 'Comprobando…';
      try {
        await E.lastfm.userInfo({ user, key }, 0);
        const changed = user !== c.user; E.config.set({ user, key }); if (changed) E.cache.clear();
        location.hash = '#/';
      } catch (err) { show('msg-error', err.message); btn.disabled = false; btn.textContent = 'Comprobar y guardar'; }
    });
    const wipe = root.querySelector('#wipe');
    if (wipe) wipe.onclick = () => { E.config.clear(); E.cache.clear(); E.renderNav(); location.hash = '#/ajustes'; E.route(); };
  };
})(window.Ecos);

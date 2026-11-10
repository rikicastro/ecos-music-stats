/* Datos de DEMOSTRACIÓN ficticios (artistas y canciones inventados). Nunca son tu historial. */
(function (E) {
  const ARTISTS = ['Luna Vacía', 'Nova Cobalto', 'Ritmo Fantasma', 'Los Faroles', 'Mar de Hierro', 'Ámbar Sur', 'DJ Marea', 'Coral Digital', 'Bruma', 'Paloma Eléctrica', 'Hielo Rojo', 'Sol Menor', 'Vértigo 88', 'Aurora Norte', 'Tierra Seca', 'Kilómetro Cero', 'Neón Calma', 'Valle Hondo', 'Cometa Azul', 'Atlas'];
  const WORDS = ['Eco', 'Noche', 'Fuego', 'Cristal', 'Sombra', 'Ciudad', 'Verano', 'Humo', 'Latido', 'Frontera', 'Espejo', 'Tormenta'];
  E.spotify.makeDemo = () => {
    let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = (a, skew = 1) => a[Math.floor(Math.pow(rnd(), skew) * a.length)];
    const out = [], now = Date.now(), start = now - 3 * 365 * 864e5;
    for (let i = 0; i < 18000; i++) {
      const day = start + Math.pow(rnd(), 0.8) * (now - start), d = new Date(day);
      const hr = rnd() < 0.7 ? 17 + Math.floor(rnd() * 7) : 7 + Math.floor(rnd() * 10);
      d.setHours(hr % 24, Math.floor(rnd() * 60), Math.floor(rnd() * 60));
      if (d.getTime() > now) continue;
      const a = pick(ARTISTS, 1.8), n = 1 + Math.floor(Math.pow(rnd(), 1.5) * 8), tr = `${WORDS[(ARTISTS.indexOf(a) + n) % WORDS.length]} ${n}`;
      const skip = rnd() < 0.22, dur = 150000 + Math.floor(rnd() * 120000), ms = skip ? Math.floor(rnd() * 25000) : dur;
      out.push({ t: Math.floor(d.getTime() / 1000), ms, a, tr, al: `${a} · Álbum ${1 + (n % 3)}`, u: 'demo:' + i, pl: ['Android', 'Android', 'Windows', 'Web', 'iOS'][Math.floor(rnd() * 5)], sh: rnd() < 0.45 ? 1 : 0, sk: skip ? 1 : 0 });
    }
    return out.sort((x, y) => x.t - y.t);
  };
})(window.Ecos);

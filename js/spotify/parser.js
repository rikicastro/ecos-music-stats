/* Historial extendido de Spotify: normalización, almacén (IndexedDB) y fusión. Todo local. */
(function (E) {
  const S = (E.spotify = E.spotify || {});
  const platform = (s) => {
    s = String(s || '').toLowerCase();
    if (/android/.test(s)) return 'Android';
    if (/ios|iphone|ipad/.test(s)) return 'iOS';
    if (/web_player|web player/.test(s)) return 'Web';
    if (/windows/.test(s)) return 'Windows';
    if (/os x|macos|mac os/.test(s)) return 'macOS';
    if (/linux|ubuntu/.test(s)) return 'Linux';
    if (/cast|tv|sonos|partner|playstation|xbox|echo|alexa|speaker/.test(s)) return 'TV / altavoces';
    return 'Otro';
  };
  /* Formato extendido (ts, ms_played, master_metadata_*) y formato corto antiguo (endTime, msPlayed...) */
  S.normalize = (r) => {
    let a, tr, al, t, ms, u, pl, sh = 0, sk = 0;
    if (r.master_metadata_track_name) {
      a = r.master_metadata_album_artist_name; tr = r.master_metadata_track_name; al = r.master_metadata_album_album_name || '';
      t = Date.parse(r.ts); ms = +r.ms_played || 0; u = r.spotify_track_uri || ''; pl = platform(r.platform);
      sh = r.shuffle ? 1 : 0; sk = r.skipped === true || r.reason_end === 'fwdbtn' ? 1 : 0;
    } else if (r.trackName) {
      a = r.artistName; tr = r.trackName; al = ''; t = Date.parse(String(r.endTime).replace(' ', 'T') + 'Z'); ms = +r.msPlayed || 0; u = ''; pl = 'Otro';
    } else return null; // podcasts, vídeo, etc.
    if (!a || !tr || isNaN(t)) return null;
    return { t: Math.floor(t / 1000), ms, a, tr, al, u, pl, sh, sk };
  };
  S.parseText = (text) => {
    const j = JSON.parse(text);
    if (!Array.isArray(j)) throw new Error('no es un historial de Spotify (se esperaba una lista)');
    const out = []; for (const r of j) { const n = S.normalize(r); if (n) out.push(n); } return out;
  };
  S.merge = (base, add) => {
    const seen = new Set(), out = [], key = (r) => r.t + '|' + (r.u || r.tr) + '|' + r.ms;
    for (const list of [base, add]) for (const r of list) { const k = key(r); if (!seen.has(k)) { seen.add(k); out.push(r); } }
    return out.sort((x, y) => x.t - y.t);
  };
  S.db = {
    get: async () => (await E.idb.get('spotify:data')) || null,
    save: (d) => E.idb.set('spotify:data', d),
    clear: () => E.idb.del('spotify:data'),
  };
})(window.Ecos);

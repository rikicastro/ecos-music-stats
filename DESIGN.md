# DESIGN.md — Fase 0

Referencia visual: stats.fm (perfil público de ejemplo, página de artista, Plus, landing; escritorio 1280×900 y móvil 375×812).
Valores marcados con ✓ medidos con getComputedStyle; el resto son aproximaciones visuales.
Nombre propuesto de la app: **Ecos** (identidad propia; no se usan logo, imágenes ni textos de stats.fm).

## 1. Paleta

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#111112` ✓ | Fondo de página y cabecera |
| `--bg-hero` | `#18181C` ✓ | Cabecera de perfil / zona stats (algo más clara), chips, placeholders |
| `--surface` | `#18181C` ✓ | Chips, avatares skeleton, controles |
| `--surface-2` | `#222226` ~ | Botones redondos (flechas, "…"), hover |
| `--text` | `#FFFFFF` ✓ | Títulos y valores |
| `--text-muted` | `#A3A3A3` ✓ | Subtítulos, etiquetas de stats |
| `--accent` | `#1ED760` ✓ | Enlaces/acento, botón principal |
| `--accent-soft` | `rgba(30,215,96,.10)` ✓ | Fondo del botón "Log in" |
| `--gold` | `#FFD54A` ~ | Insignia Plus (nosotros: no necesaria) |

Para Ecos: mantener estructura oscura casi negra con superficies +1 nivel de luminosidad, pero **acento propio** (p. ej. violeta/ámbar `#8B7CFF` o coral) para no copiar el verde de marca.

## 2. Tipografía
- Fuente propia sans geométrica (StatsfmSans). Alternativa libre: **Inter** o **DM Sans** (Google Fonts) ✓ pesos 400/500/700/800.
- h1 (nombre de perfil): 36px / 800 ✓
- h2 (cabecera de sección): 30px / 700 ✓
- Valor de stat: ~20px / 700 blanco; etiqueta: ~14px / 500 gris.
- Subtítulo de sección: ~14px / 600 gris `#A3A3A3`.
- Cuerpo y chips: 16px / 400–500 ✓
- Pie de tarjeta de elemento: título 14–15px bold, meta 13px gris, truncado con elipsis.

## 3. Radios, sombras, espaciado
- Botones y selectores: radio **16px** ✓; chips: **9999px** ✓ con padding `8px 16px` ✓; avatar: círculo ✓.
- Carátulas en carruseles: **0px** (cuadradas, 100–160px); en Ecos podemos usar 8–12px para modernizar.
- **Sin sombras** visibles (diseño plano; separación por contraste de fondo). En Ecos: sombra mínima solo en hover/overlays.
- Contenedor ~1200px, gutter 20px (móvil 16px). Secciones separadas ~48–64px; cabecera→contenido ~16px.

## 4. Componentes

**Navegación**: cabecera superior simple, logo+nombre a la izquierda, enlaces de texto (Plus, Soporte…) y a la derecha buscador oscuro (fondo negro, borde radio 12) y botón "Log in" verde translúcido. Móvil: logo + botón, sin menú desplegado. Para Ecos: barra superior + pestañas (Perfil, Artistas, Canciones, Álbumes, Actividad) y barra inferior en móvil.

**Cabecera de perfil**: bloque de fondo `#18181C`; escritorio: avatar circular grande 120px a la izquierda con insignia superpuesta abajo-derecha, a su derecha nombre (800) + pronombres en gris pequeño, bio con enlace en acento, "N amigos" en gris, iconos de servicios. Móvil: todo **centrado** y avatar ~95px.

**Fila de stats**: números en blanco bold sobre etiqueta gris, 4–6 en cuadrícula con envoltura (streams, minutos, horas, pistas/artistas/álbumes distintos); a la derecha un **selector de periodo** desplegable (4 semanas por defecto).

**Chips de géneros**: píldoras `#18181C`, texto blanco 500, fila con scroll horizontal.

**Carruseles Top (pistas/artistas/álbumes)**: título h2 + subtítulo gris; a la derecha 3 botones redondos (cambiar a vista cuadrícula, ‹ ›, "…"). Tarjetas de 160px: carátula, `N. Título` en negrita, `X minutos • Y reproducciones • Artista` en gris.

**Rankings con barras**: stats.fm usa tarjetas/listas con posición; las barras relativas no aparecen en esta vista, así que en Ecos las añadimos (barra fina del color de acento, ancho = valor/máx, sobre fila con posición, carátula, nombre, meta).

**Gráficos**: stats.fm los reserva a Plus (relojes de escucha, actividad). En Ecos: Chart.js, fondo transparente, rejilla `rgba(255,255,255,.06)`, series en acento, tooltip oscuro.

**Estados de carga / bloqueado**: skeletons = misma forma del contenido con relleno `#18181C` (círculo del avatar, chips vacíos, tarjetas grises). Estado "Inicia sesión para ver" en el texto de stats bloqueadas (en Ecos: estados vacíos con icono y texto explicativo).

**Página de artista**: avatar circular, nombre, seguidores, 4 stats (veces escuchado, minutos, primera y última reproducción), popularidad 0–10, géneros, secciones Top pistas / Top álbumes / Oyentes / Artistas relacionados.

**Plus (marketing)**: hero con mosaico de avatares circulares flotantes, CTA amarillo, tabla Free vs Plus. No aplicable (no hay monetización).

## 5. Capturas
Tomadas con el navegador integrado (escritorio y móvil) en esta sesión: landing, perfil (cabecera, stats, géneros, carruseles), artista (skeleton/bloqueado), Plus, perfil móvil. Se guardan solo en la caché de la sesión, no en el repositorio.

## 6. Qué ofrece stats.fm → viabilidad

Leyenda: **LFM** = posible con Last.fm · **SPO** = necesita historial de Spotify · **NV** = no viable en web estática

| Función | Gratis/Plus | Viabilidad |
|---|---|---|
| Perfil: avatar, fecha de registro, scrobbles totales | Gratis | LFM |
| Ahora suena / últimas canciones | Gratis | LFM |
| Reproducciones (streams) por periodo | Gratis | LFM (scrobbles) |
| **Minutos/horas escuchados** | Plus | SPO (Last.fm no da duración fiable) |
| Pistas/artistas/álbumes distintos | Gratis | LFM (parcial: artistas totales por `getTopArtists`) |
| Top artistas/canciones/álbumes 4 sem–siempre | Gratis (50) / Plus (10.000) | LFM (hasta 1000 por llamada paginada) |
| Ordenar por minutos | Plus | SPO |
| Géneros top | Gratis | LFM (tags de artistas, aproximado) |
| Página de artista/pista/álbum (info, tags, similares) | Gratis | LFM |
| Fecha primera/última escucha de un elemento | Plus | LFM (con historial completo paginado) / SPO |
| Reproducciones por día / meses | Plus | LFM (paginando `getRecentTracks`) |
| Reloj de escucha: hora × día de la semana | Plus | LFM (zona horaria del navegador) |
| Rachas (días consecutivos) | Plus | LFM |
| Día más escuchado | Plus | LFM |
| Historial de toda la vida / importación | Plus | SPO |
| Saltos (skips), shuffle, dispositivos/plataformas | Plus | SPO |
| Comparativa por años | Plus | LFM (scrobbles) / SPO (minutos) |
| Amigos, soulmates, top oyentes, perfiles privados | Gratis/Plus | NV (requiere backend y cuentas) |
| Compartir tarjetas/stories como imagen | Gratis | Posible con canvas (opcional, fuera de plan) |
| Estadísticas de reproductores en directo de Spotify | Gratis | NV |

Notas Last.fm: la API admite CORS (se comprobará en Fase 1 antes de seguir). `getRecentTracks` da máx. 200 por página, de ahí la importancia de la caché en Fase 3. No hay duración real por scrobble, por eso minutos = Spotify.

## 7. Estructura de archivos propuesta

```
index.html            # shell + router por hash (#/perfil, #/artistas...)
css/
  tokens.css          # variables (colores, radios, espaciado, tipografía)
  base.css            # reset, tipografía, layout, utilidades
  components.css      # tarjetas, chips, botones, barras, skeletons
  pages.css           # estilos por pantalla
js/
  main.js             # arranque, router, navegación
  config.js           # usuario/API key en localStorage
  api/lastfm.js       # cliente + caché + errores/límites
  api/cache.js
  ui/                 # helpers de DOM, skeleton, empty-state, toasts
  pages/              # profile.js, tops.js, detail.js, activity.js, import.js
  charts/             # heatmap.js, daily.js, genres.js (Chart.js CDN fija)
  spotify/            # parser.js, db.js (IndexedDB), stats.js, demo.js
README.md  DESIGN.md
```
Módulos ES nativos (`<script type="module">`), router por hash (compatible con GitHub Pages y `file://` salvo CORS de módulos; ver Fase 1).

## 8. Plan por fases y complejidad

| Fase | Contenido | Complejidad |
|---|---|---|
| 1 | Esqueleto, diseño, config, API + caché, perfil | Media |
| 2 | Tops + detalle | Media |
| 3 | Actividad y gráficos (paginación pesada) | Alta |
| 4 | Pulido visual y responsive | Media |
| 5 | Importador Spotify + IndexedDB + demo | Alta |
| 6 | README, revisión de claves, publicación | Baja |

Riesgo a vigilar: módulos ES abiertos con `file://` pueden bloquearse por CORS en algunos navegadores (Chrome); se resolverá en Fase 1 (o con scripts clásicos).

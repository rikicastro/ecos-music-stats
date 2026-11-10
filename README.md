# Ecos · estadísticas de música

Web estática (HTML + CSS + JS, sin servidor ni paso de build) con tus estadísticas de **Last.fm** y, opcionalmente, tu **historial extendido de Spotify**. Interfaz en español, tema oscuro.

## Qué incluye
- **Perfil:** scrobbles, fecha de registro, «suena ahora» y últimas canciones.
- **Informes:** semana, mes o año comparados con el periodo anterior: reproducciones, tendencias, artista/álbum/canción top, etiquetas populares, reloj de escucha, canciones en repetición y descubrimientos.
- **Charts:** tops de 7 días, 30 días, 365 días o siempre, en carruseles; «Ver más» abre la lista completa (artistas, canciones, álbumes) con barras y detalle de cada elemento.
- **Actividad:** reproducciones por día, mapa de calor hora × día, rachas, día más escuchado, tendencia mensual y géneros.
- **Spotify (opcional):** minutos escuchados, tops por tiempo, comparativa por año, saltos, shuffle, plataformas y horas pico.

## Usar en local
Abre `index.html` en el navegador (doble clic). Funciona con `file://` porque usa scripts clásicos, no módulos ES.

Si prefieres un servidor local: `npx serve .` o `python3 -m http.server` dentro de esta carpeta.

## Conectar Last.fm
1. Crea una API key gratuita en <https://www.last.fm/api/account/create> (solo necesitas la «API key»).
2. Abre la web, ve a **Conectar** e introduce tu usuario y la clave.

El usuario y la clave se guardan **solo en el `localStorage` de tu navegador**. No están en ningún archivo del repositorio. Last.fm exige enviar la clave en la URL de cada petición, así que no la compartas ni uses la web en equipos que no sean tuyos.

## Importar tu historial de Spotify
1. Solicita «Historial de streaming extendido» en <https://www.spotify.com/account/privacy/> (puede tardar hasta 30 días).
2. En la sección **Spotify**, arrastra los archivos `Streaming_History_Audio_*.json`.

Todo se procesa en tu navegador y se guarda en IndexedDB; nada se sube a ningún servidor. Si aún no los tienes, hay un botón de **datos de demostración** ficticios (marcados como demo). «Borrar datos» elimina lo guardado.

## Publicar en GitHub Pages
1. Sube el contenido de esta carpeta a un repositorio (rama `main`).
2. En **Settings → Pages**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. La web quedará en `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

## Estructura
```
index.html           shell y carga de scripts
css/                 tokens, base, componentes y páginas
js/                  util, config, cache, lastfm, store, main
js/pages/            perfil, informes, charts, tops, detalle, actividad, spotify, ajustes
js/reports/          descarga por periodo, comparativas y descubrimientos
js/images.js         imágenes de artistas/canciones/álbumes (Deezer)
js/charts/           análisis, gráficos (Chart.js 4.4.1 por CDN) y mapa de calor
js/spotify/          parser, estadísticas y datos demo
DESIGN.md            notas de diseño y viabilidad de funciones
```
Los archivos de `.claude/` son solo de desarrollo (servidor de previsualización y simulación de la API) y no forman parte de la web.

## Créditos y límites
Datos de Last.fm. Las imágenes de artistas, canciones y álbumes se buscan en la API pública de Deezer (solo se envía el nombre del artista/canción/álbum) y se guardan en caché en tu navegador. Ecos no está afiliado a Last.fm, Spotify ni stats.fm. Si no se encuentra una imagen se muestra una inicial de color. Los minutos solo están disponibles con el historial de Spotify.

# Booqui — Issue #1: Problema de estilos en GitHub Pages

> **Repositorio:** https://github.com/RenzoRamosDEV/Booqui-Sistema-Gestion-Reservas-Eventos
> **Issue:** https://github.com/RenzoRamosDEV/Booqui-Sistema-Gestion-Reservas-Eventos/issues/1
> **Componente afectado:** `front-demo` (React + Vite)
> **Fecha del análisis:** 2026-05-30

---

## 1. Descripción de la incidencia

La aplicación web de `front-demo` se renderiza **correctamente en local** pero **rota en GitHub Pages**:

- La barra de navegación (Navbar) pierde su estructura.
- Los estilos CSS no se aplican o se aplican parcialmente.
- La interfaz aparece desalineada / visualmente rota.

---

## 2. Causa raíz

El archivo **`front-demo/src/index.css` NO contiene CSS**: contiene un **módulo JavaScript**
(una API de eventos basada en `axios`). Es decir, alguien guardó por error código de API
dentro del stylesheet global, **sobrescribiendo** el contenido CSS original.

Contenido actual (incorrecto) de `front-demo/src/index.css`:

```js
import axios from 'axios'

const BASE = import.meta.env.VITE_EVENT_API

export const getAllEvents = () => axios.get(BASE)
export const getEventById = (id) => axios.get(`${BASE}/${id}`)
export const getEventsByCategory = (category) => axios.get(`${BASE}/search/category?category=${category}`)
export const getEventsByTitle = (title) => axios.get(`${BASE}/search/title?title=${title}`)
export const getEventsByLocation = (location) => axios.get(`${BASE}/search/location?location=${location}`)
export const createEvent = (data) => axios.post(BASE, data)
export const updateEvent = (email, data) => axios.put(`${BASE}/email/${email}`, data)
export const deleteEvent = (email) => axios.delete(`${BASE}/email/${email}`)
```

Este archivo se importa en `front-demo/src/main.jsx`:

```js
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'   // <-- se espera CSS, pero contiene JavaScript
```

### ¿Por qué funciona en local pero se rompe en GitHub Pages?

- **En local:** el servidor de desarrollo de Vite (con HMR) mantiene en memoria el `index.css`
  correcto y/o el desarrollador tiene una copia local sin commitear. Por eso "se ve bien".
- **En GitHub Pages:** el sitio se construye desde el repositorio **commiteado**, donde
  `index.css` está corrupto. Al ejecutar `vite build`, se pierden los estilos globales
  (fuente, resets, layout base) y el JavaScript basura llega a colarse dentro del bundle CSS
  de producción.

**Comprobación real:** descargando el CSS servido en vivo
(`https://renzoramosdev.github.io/Booqui-Sistema-Gestion-Reservas-Eventos/assets/index-*.css`)
se confirma que contiene los tokens `axios`, `getAllEvents` e `import.meta.env.VITE_EVENT_API`
— prueba de que el JS se filtró al CSS de producción.

### Dato adicional importante

Ese código JS es, además, **código muerto**:

- La aplicación obtiene los datos de `front-demo/src/data/mockData.js`.
- **Nadie importa** `getAllEvents` ni el resto de funciones (se verificó en todo `src/`).

---

## 3. Hipótesis descartadas (para que conste el análisis)

| Hipótesis | Resultado |
|-----------|-----------|
| Ruta `base` mal configurada en Vite | ❌ Descartada. `vite.config.js` ya tiene `base: './'` (correcto para subdirectorio). |
| Routing con `BrowserRouter` (rompe rutas en Pages) | ❌ Descartada. La app usa `HashRouter`, que es lo correcto para GitHub Pages. |
| Sensibilidad a mayúsculas/minúsculas (Windows vs Linux) | ❌ Descartada. Todos los imports de `.css` e imágenes coinciden exactamente con los nombres reales de los archivos. |
| Assets que devuelven 404 en Pages | ❌ Descartada. El CSS y el JS cargan con HTTP 200. |
| **`index.css` corrupto con JavaScript** | ✅ **CAUSA CONFIRMADA.** |

---

## 4. Solución — Archivos a modificar

### 4.1. MODIFICAR: `front-demo/src/index.css`

Reemplazar el contenido JavaScript por estilos globales reales.

> ⚠️ El contenido CSS original se perdió en el repositorio (incluso el build antiguo de la
> carpeta `docs/` ya estaba corrupto), por lo que se reconstruye con valores globales
> sensatos y coherentes con la app (fuente DM Sans, ya usada en el Navbar). Como Bootstrap
> ya aplica su propio *reboot*, estos estilos son seguros y no entran en conflicto.

**Contenido nuevo:**

```css
/* Estilos globales de Booqi
   NOTA: este archivo había sido sobrescrito por error con código JavaScript
   (un módulo de API de eventos), lo que rompía el renderizado en GitHub Pages.
   El código JS se movió a src/api/eventsApi.js. */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
```

### 4.2. CREAR: `front-demo/src/api/eventsApi.js`

Para no perder el código de la API que estaba mal ubicado dentro del CSS, se mueve a un
módulo JavaScript con nombre correcto. (Actualmente no lo usa nadie, pero se conserva por si
se necesita más adelante.)

**Contenido nuevo:**

```js
import axios from 'axios'

const BASE = import.meta.env.VITE_EVENT_API

export const getAllEvents = () => axios.get(BASE)
export const getEventById = (id) => axios.get(`${BASE}/${id}`)
export const getEventsByCategory = (category) => axios.get(`${BASE}/search/category?category=${category}`)
export const getEventsByTitle = (title) => axios.get(`${BASE}/search/title?title=${title}`)
export const getEventsByLocation = (location) => axios.get(`${BASE}/search/location?location=${location}`)
export const createEvent = (data) => axios.post(BASE, data)
export const updateEvent = (email, data) => axios.put(`${BASE}/email/${email}`, data)
export const deleteEvent = (email) => axios.delete(`${BASE}/email/${email}`)
```

---

## 5. Verificación realizada

Tras aplicar los cambios se reconstruyó el proyecto:

```bash
cd front-demo
npm ci
npm run build
```

Resultado: **build correcto** (`✓ built in ~4s`). Comprobaciones sobre el nuevo bundle CSS
(`dist/assets/index-*.css`):

- ✅ **0** coincidencias de `axios` / `getAllEvents` / `import.meta.env.VITE_EVENT` (CSS limpio).
- ✅ Estilos del Navbar presentes (`booqi-navbar`, `announcement-bar`).
- ✅ Nuevos estilos globales presentes (`scroll-behavior:smooth`, `font-smoothing`).

---

## 6. Cómo aplicar y desplegar

1. Modificar `front-demo/src/index.css` con el contenido del punto **4.1**.
2. Crear `front-demo/src/api/eventsApi.js` con el contenido del punto **4.2**.
3. Commit y push a la rama `main`:

   ```bash
   git add front-demo/src/index.css front-demo/src/api/eventsApi.js
   git commit -m "fix(front-demo): restaurar index.css (contenía JS) que rompía estilos en GitHub Pages"
   git push origin main
   ```

4. El workflow `.github/workflows/deploy.yml` reconstruirá y redesplegará automáticamente
   a GitHub Pages.

---

## 7. Recomendación adicional (despliegue duplicado)

El repositorio tiene **dos mecanismos de despliegue que compiten entre sí**:

1. `.github/workflows/deploy.yml` → GitHub Actions que construye `front-demo/dist`
   (es el **activo** actualmente, según los hashes de los assets servidos en vivo).
2. Una carpeta `docs/` en la raíz con un **build antiguo y ya corrupto**.

Se recomienda **eliminar la carpeta `docs/`** para evitar confusión, ya que no es la fuente
activa de GitHub Pages y contiene una versión obsoleta. Conviene asegurarse en
*Settings → Pages* de que la fuente (*Source*) sea **GitHub Actions** y no *Deploy from a
branch /docs*.

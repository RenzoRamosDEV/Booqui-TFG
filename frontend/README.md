# Booqi — frontend

Aplicación web de Booqi: React 19 + TypeScript estricto + Vite, Tailwind CSS v4, `motion`, React Router v7,
TanStack Query, Axios, React Hook Form + Zod, Zustand y Lucide. Pruebas con Vitest + Testing Library y
Playwright. El contrato con el backend está en [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) y la lista de
paridad funcional en [`docs/FEATURE_PARITY.md`](docs/FEATURE_PARITY.md).

## Puesta en marcha

Requisitos: Node 22 (o superior) y npm.

```bash
npm ci
npm run dev
```

El servidor de desarrollo de Vite hace de proxy de `/api/v1/users` (8080), `/api/v1/events` (8081),
`/api/v1/bookings` (8082) y `/api/v1/payments` (8083), así que basta con tener los servicios levantados en
local (`make up` desde la raíz del repositorio).

## Scripts

| Script                  | Qué hace                                                        |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo con HMR                                  |
| `npm run build`         | Comprueba tipos (`tsc -b`, modo estricto) y genera `dist/`      |
| `npm run preview`       | Sirve `dist/` en local                                          |
| `npm run lint`          | ESLint                                                          |
| `npm run format`        | Aplica Prettier                                                 |
| `npm run format:check`  | Comprueba el formato con Prettier                               |
| `npm test`              | Ejecuta una vez todas las pruebas unitarias (Vitest, sin watch) |
| `npm run test:mutation` | Mutation testing de la lógica con Stryker (máx. 3 min)          |
| `npm run test:e2e`      | Pruebas end-to-end con Playwright (Chromium)                    |

Antes de la primera ejecución de las pruebas end-to-end hay que instalar el navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright construye la app y la sirve con `vite preview` en el puerto `4180` (configurable con `E2E_PORT`).
No reutiliza servidores ya arrancados, para no probar por error otra aplicación que ocupe el puerto.

## Estructura de carpetas

```
frontend/
  index.html          # script de tema sin parpadeo, favicon y metadatos Open Graph
  nginx.conf  Dockerfile  .dockerignore  .env.example
  public/             # BOOQI2.png (favicon e imagen OG)
  docs/               # contrato de API y paridad funcional
  e2e/                # pruebas Playwright
  src/
    main.tsx
    app/              # router, providers, layout, guards, páginas genéricas, PageMeta
    components/ui/    # componentes base (con sus *.test.tsx al lado)
    components/       # piezas visuales compartidas (BrandBackdrop)
    features/auth/    # esquema Zod del usuario, store de sesión y reglas de acceso
    lib/              # lógica pura: HTTP, errores, tema, animaciones, paginación, utilidades
    styles/           # tokens.css y globals.css
    types/            # tipos de dominio compartidos
    assets/           # logo de la navbar
```

Las dependencias van en un solo sentido: `app → features → components → lib → types`. `lib` y `types` no
importan nada de las capas superiores y los componentes de UI no importan `features`.

## Entorno

Las variables se leen en tiempo de build (`import.meta.env`). Copia `.env.example` a `.env.local` si necesitas
cambiarlas.

| Variable            | Por defecto | Uso                                                                                                      |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | vacío       | Prefijo absoluto de la API. Vacío = rutas relativas `/api/v1/...` del mismo origen (proxy de nginx/Vite) |

## Docker

La imagen se construye en dos etapas: `node:22-alpine` instala las dependencias con `npm ci` y ejecuta
`npm run build`; `nginx:alpine` sirve `dist/` con `nginx.conf`, que además hace de proxy de `/api/v1/*` hacia
los servicios y devuelve `index.html` para cualquier ruta del cliente. Escucha en el puerto 80.

```bash
docker build -t booqi/frontend:local .
```

En el stack completo la construye el servicio `booqi-frontend` de `infra/docker/docker-compose.yml`
(`make up` desde la raíz).

## Tokens de diseño y tema

Los colores son variables CSS definidas en `src/styles/tokens.css`: `:root` para el tema claro y `.dark` para el
oscuro. Tailwind v4 las expone como utilidades (`bg-bg`, `text-fg`, `text-fg-muted`, `bg-primary`,
`ring-ring`, `bg-brand-600`…) mediante `@theme inline` en `src/styles/globals.css`, y la variante `dark:` se
activa con la clase `.dark` del elemento raíz.

- Escala morada `--brand-50`…`--brand-950` con `--brand-600 = #7C3AED`. Solo estos tonos pueden ajustarse para
  cumplir contraste; el resto de valores base (`--bg`, `--fg`, `--surface`…) son fijos.
- Radios generosos (12/16/20 px), sombras tintadas de morado en claro y bordes sutiles en oscuro, degradado de
  marca (`bg-gradient-brand`, `text-gradient-brand`) y fondo con halos suaves.
- `src/styles/tokens.test.ts` es un test golden: comprueba los valores exactos de ambos temas y que cada pareja
  texto/fondo tiene un contraste WCAG ≥ 4.5 (`src/lib/contrast.ts`).

El tema sigue al sistema operativo hasta que el usuario elige uno; la elección se guarda como `light` o `dark` en
`localStorage['booqi-theme']`. Para evitar el parpadeo, `index.html` lleva un script en línea en `<head>` (antes de
cualquier hoja de estilos) que aplica la clase `.dark` y `color-scheme` antes del primer pintado. La misma regla
vive en `src/lib/theme.ts` (`resolveTheme`, `applyTheme`); `src/app/theme-script.test.ts` ejecuta el script real
de `index.html` en jsdom con todas las combinaciones guardado × sistema y lo compara con `resolveTheme`, así que
no pueden divergir. `src/lib/theme-store.ts` (Zustand, sin `persist` porque el script necesita el valor en
crudo) expone `theme` y `toggle()`.

Las fuentes (Space Grotesk para titulares, Inter para el texto) se sirven desde el propio origen con
`@fontsource-variable`; no se hace ninguna petición a Google Fonts.

## Componentes UI

Los componentes base viven en `src/components/ui/`, hechos a mano sobre Tailwind (variantes con mapas de
clases y `cn()`), con sus pruebas al lado. Todos muestran un anillo de foco `--ring` con `focus-visible`.

| Componente                    | Variantes / props clave                                                             | Contrato de accesibilidad                                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                      | `variant` primary · secondary · ghost · destructive; `size` sm · md · lg; `loading` | `type="button"` por defecto; en `loading` queda deshabilitado, con `aria-busy="true"` e ignora clics; escala ≤ 1,02 al pasar el ratón (sin escala con movimiento reducido)                        |
| `Input`, `Select`, `Textarea` | `label` (obligatorio), `error`, props nativas y `ref` (React Hook Form)             | Etiqueta visible asociada con `useId()`; con `error`: `aria-invalid="true"` y `aria-describedby` al mensaje mostrado bajo el campo                                                                |
| `Card`                        | props de `div`                                                                      | Contenedor neutro                                                                                                                                                                                 |
| `Badge`                       | `tone` neutral · brand · success · warning · danger                                 | Texto, nunca solo color                                                                                                                                                                           |
| `Skeleton`                    | `className` para el tamaño                                                          | `aria-hidden="true"`; quien lo use marca la región con `aria-busy`; sin animación con movimiento reducido                                                                                         |
| `Avatar`                      | `name`, `src` opcional                                                              | Imagen con `alt` = nombre; sin imagen (o si falla) iniciales con `role="img"` y `aria-label`                                                                                                      |
| `EmptyState`                  | `title`, `description`, `icon`, `action`                                            | Título como `h2`                                                                                                                                                                                  |
| `Tabs`                        | `label`, `items`, `defaultValue`, `onChange`                                        | `tablist`/`tab`/`tabpanel` enlazados; tabindex itinerante; ←/→ (circular), Inicio y Fin mueven foco y selección                                                                                   |
| `Pagination`                  | `page`, `totalPages`, `onPageChange`                                                | `nav` «Paginación»; anterior/siguiente deshabilitados en los extremos; `aria-current="page"`; elipsis ocultas al lector                                                                           |
| `Dialog`, `Drawer`            | `open`, `onClose`, `title`, `description`, `footer`                                 | Portal a `body`, `role="dialog"`, `aria-modal`, nombre y descripción; foco atrapado (Tab circular), Escape/fondo/botón «Cerrar» cierran, foco devuelto al disparador, scroll del `body` bloqueado |
| `ToastProvider` + `useToast`  | `show({ title, description, tone, duration = 4000 })`, `dismiss(id)`                | Región `role="status"` `aria-live="polite"` siempre presente; cierre automático y botón «Cerrar notificación»                                                                                     |

Las animaciones salen de `src/lib/motion.ts` (`overlayTransition`, `toastTransition`, `pressable`), que con
movimiento reducido devuelven solo fundidos de opacidad de 150 ms. `Dialog`/`Drawer` no usan `<dialog>` nativo:
jsdom no implementa `showModal` y la animación de salida necesita el elemento montado.

## HTTP y errores

Todas las llamadas pasan por la instancia única `http` de `src/lib/http.ts` (Axios): `baseURL` =
`VITE_API_BASE_URL` (vacío por defecto), cabeceras JSON y nada más. No hay interceptor de petición: el backend no
emite token ni cookie, así que no se envía `Authorization` ni se reintenta/refresca nada ante un `401`.

El interceptor de respuesta convierte cualquier fallo en un `ApiError` (`src/lib/api-error.ts`), una clase que
extiende `Error` (funciona con `instanceof` también dentro de TanStack Query):

| Campo         | Origen                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `status`      | Estado HTTP de la respuesta; `0` sin respuesta (red caída, timeout); `-1` si el fallo no es HTTP (bug local) |
| `title`       | `title` del ProblemDetail si es texto; si no, vacío                                                          |
| `detail`      | Primer valor no vacío entre `detail`, `message` y `error` del cuerpo; si no hay (o el cuerpo es HTML), vacío |
| `fieldErrors` | `errors[{ field, message }]` → `{ [field]: message }`, ignorando elementos mal formados; ausente si no hay   |

`userMessage(error, overrides?)` (`src/lib/error-messages.ts`) da el texto que ve el usuario: el `detail` si no
está en blanco; si no, la sobrescritura de la pantalla para ese estado, y si no, el mensaje por defecto:

| Estado | Mensaje                                              |
| ------ | ---------------------------------------------------- |
| 400    | Datos inválidos. Revisa los campos.                  |
| 401    | No tienes autorización para esta acción.             |
| 404    | No se ha encontrado lo que buscas.                   |
| 409    | Ya existe un registro con esos datos.                |
| 422    | La operación no se puede completar.                  |
| 503    | El servicio no está disponible. Inténtalo más tarde. |
| 0      | No se pudo conectar con el servidor.                 |
| otro   | Ha ocurrido un error inesperado.                     |

Los `detail` de negocio del backend llegan en inglés y se muestran tal cual; las pantallas que necesiten texto en
español lo sustituyen por estado con `overrides`.

Política de TanStack Query (`createQueryClient()` en `src/lib/query-client.ts`): las lecturas fallidas con estado
`0` o `≥ 500` se reintentan una sola vez (absorbe un `503` puntual de booking/payment); los `4xx` y los errores que
no son `ApiError` no se reintentan; las escrituras nunca se reintentan; sin recarga al volver el foco a la ventana.

## Sesión y guards

- **Sin token.** El backend no emite token ni cookie: el login (`POST /api/v1/users/login`) devuelve un
  `UserResponse` y esa es la sesión. Nunca se envía `Authorization` ni se intenta refrescar nada.
- **Store.** `useSessionStore` (`src/features/auth/hooks/session-store.ts`, Zustand + `persist`) guarda
  `{ user }` en `localStorage['booqi-session']` y expone `signIn(user)` y `signOut()`; `signOut` borra la clave.
- **Validación al cargar.** Al rehidratar, el valor guardado se valida con Zod (`userResponseSchema` en
  `src/features/auth/api/schemas.ts`). JSON inválido, campos que faltan o un `role` distinto de `ADMIN`/`CUSTOMER`
  se descartan: no hay sesión y la clave se elimina.
- **Sesiones antiguas.** La app anterior usaba `localStorage['booqi_user']` con otro formato; no se migra, así que
  cada navegador vuelve a iniciar sesión una vez.
- **Reglas de acceso** (`src/features/auth/hooks/access.ts`): `resolveAccess(user, 'auth' | 'admin')` devuelve
  `allow`, `login` o `forbidden`; `loginRedirectPath` construye `/login?redirect=<ruta y query codificadas>`;
  `resolvePostLoginPath(user, redirect)` solo acepta rutas que empiezan por una única `/` (rechaza `//host`,
  `/\host` y URLs absolutas) y si no, manda a `/admin` (ADMIN) o `/` (CUSTOMER).
- **`<RequireAuth requirement>`** (`src/app/guards.tsx`) envuelve rutas: sin sesión redirige a login; con un rol
  insuficiente muestra la página de no encontrado sin montar el contenido protegido, así que no se dispara ninguna
  petición de administración.
- **Solo en el cliente.** Los roles se comprueban únicamente en el navegador; el backend no tiene autorización y
  cualquiera puede llamar a la API directamente. Los guards son experiencia de usuario, no seguridad.

## Mutation testing

`npm run test:mutation` ejecuta Stryker sobre `src/lib/**`, `src/features/**/api/**` y `src/features/**/hooks/**`
(sin los `*.test.ts`). Falla si la puntuación es ≤ 95 % (`thresholds.break`) y `timeout 180` lo aborta con código
124 si supera los 3 minutos. El modo incremental (`reports/stryker-incremental.json`) reutiliza resultados entre
ejecuciones; si un resultado parece obsoleto tras cambiar un test, añade `--force`. Para limitarlo a unos
ficheros:

```bash
npm run test:mutation -- --mutate src/lib/contrast.ts,src/lib/theme.ts
```

El informe HTML queda en `reports/mutation/index.html`. Con el modo incremental el informe muestra también los
resultados guardados de ficheros fuera del `--mutate`; la puntuación de un cambio se lee en sus filas.

### Mutantes supervivientes justificados

| Fichero                                       | Mutante                                                    | Por qué sobrevive                                                                                                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/contrast.ts:5`                       | `srgb <= 0.04045` → `srgb < 0.04045`                       | Equivalente: los canales son enteros de 8 bits y ninguno da exactamente 0,04045 (10/255 = 0,0392 y 11/255 = 0,0431), así que ambas comparaciones eligen siempre el mismo tramo.                                          |
| `src/lib/use-focus-trap.ts:51`                | `previouslyFocused?.focus()` → `previouslyFocused.focus()` | Equivalente en la práctica: `document.activeElement` solo es `null` sin documento cargado; con la app montada siempre hay un elemento activo (como mínimo `body`). El `?.` se mantiene porque el tipo DOM admite `null`. |
| `src/features/auth/hooks/session-store.ts:24` | `catch { return undefined }` → `catch {}`                  | Equivalente: un bloque vacío también devuelve `undefined`, que Zod rechaza igual que antes.                                                                                                                              |

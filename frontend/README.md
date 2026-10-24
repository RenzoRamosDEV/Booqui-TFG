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

| Script                 | Qué hace                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con HMR                                  |
| `npm run build`        | Comprueba tipos (`tsc -b`, modo estricto) y genera `dist/`      |
| `npm run preview`      | Sirve `dist/` en local                                          |
| `npm run lint`         | ESLint                                                          |
| `npm run format`       | Aplica Prettier                                                 |
| `npm run format:check` | Comprueba el formato con Prettier                               |
| `npm test`             | Ejecuta una vez todas las pruebas unitarias (Vitest, sin watch) |
| `npm run test:e2e`     | Pruebas end-to-end con Playwright (Chromium)                    |

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

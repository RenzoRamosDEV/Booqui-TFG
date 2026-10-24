# 0005. Proxy de la API en el frontend (nginx y Vite)

- Estado: Aceptada
- Fecha: 2026-10-24

## Contexto y problema

El frontend llamaba a los servicios con URLs absolutas que debían conocerse al construir la imagen
(`http://localhost:8080/...`). Eso ataba la imagen a un host concreto, obligaba a publicar los puertos de los cuatro
servicios y ponía CORS en el camino de cada petición del navegador. Además, en hosts *rootless* el frontend no puede
publicarse en el puerto 80, y cualquier cambio de puerto rompía el login por la comprobación de origen de CORS.

¿Cómo debe el navegador llegar a las APIs sin depender del host ni del puerto en que se publica el frontend?

## Decisión

- El navegador llama siempre al **mismo origen**: rutas relativas `/api/v1/...`. Cada módulo de `frontend/src/api/`
  antepone `VITE_API_BASE_URL`, que por defecto está vacío (`frontend/.env.example`).
- **nginx** (imagen del frontend, `frontend/nginx.conf`) hace de proxy por prefijo:
  - `location /api/v1/users` → `http://booqi-user-service:8080`
  - `location /api/v1/events` → `http://booqi-event-service:8081`
  - `location /api/v1/bookings` → `http://booqi-booking-service:8082`
  - `location /api/v1/payments` → `http://booqi-payment-service:8083`
  - cada uno con `proxy_set_header Host $http_host` (además de `X-Real-IP`, `X-Forwarded-For` y `X-Forwarded-Proto`).
    `$http_host` conserva el puerto publicado, así que una petición cuyo `Origin` es `http://localhost:8088` sigue siendo
    del mismo origen para la comprobación CORS de Spring. Con `$host` se perdería el puerto y el login respondería `403`.
  - `location /` sirve la SPA con `try_files $uri $uri/ /index.html`.
- **Vite** (`npm run dev`) replica el mismo proxy en `server.proxy` hacia `http://localhost:8080`–`8083`, **sin
  `changeOrigin`**, por el mismo motivo: el `Host` reenviado debe coincidir con el `Origin` del navegador.
- Los puertos de los servicios solo se publican en el host mediante el override de desarrollo
  `infra/docker/docker-compose.override.yml`, que el `Makefile` carga siempre. Sin él, el único punto de entrada es el
  frontend.

## Consecuencias

### Positivas

- La misma imagen funciona en cualquier host y puerto (`BOOQI_FRONTEND_PORT`), sin variables de construcción.
- CORS deja de intervenir en el uso normal; `BOOQI_CORS_ALLOWED_ORIGINS` solo importa para llamadas directas a los puertos
  de los servicios.
- En producción bastaría con publicar el frontend.

### Negativas

- Swagger UI y `/actuator/health` no pasan por el proxy: solo se alcanzan en los puertos de los servicios, que publica el
  override de desarrollo.
- Añadir un recurso nuevo exige añadir su `location` en `nginx.conf` y su entrada en `vite.config.js`.

## Alternativas consideradas

- **URLs absolutas en tiempo de construcción** (`ARG VITE_*` en el `Dockerfile`). Rechazada: ata la imagen a un host y
  mantiene CORS en el camino del navegador.
- **Servicio API gateway dedicado** (Spring Cloud Gateway u otro). Rechazada: un contenedor más que mantener para cuatro
  rutas que nginx ya resuelve.
- **Solo CORS, llamadas directas a cada servicio.** Rechazada: obliga a publicar los cuatro puertos y a mantener la lista
  de orígenes sincronizada con cada forma de despliegue.

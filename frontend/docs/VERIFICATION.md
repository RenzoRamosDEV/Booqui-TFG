# Informe de verificación del frontend

Evidencia de que el frontend reescrito funciona contra los servicios reales del stack de compose, no solo contra la
API simulada de Playwright. Los registros completos están en `frontend/reports/delivery/` (no se versionan).

| Dato                     | Valor                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Fecha                    | 2026-10-24                                                                                       |
| Commit verificado        | `bb507b5` (`git rev-parse --short HEAD`)                                                         |
| Runtime de contenedores  | Podman 5.8.9 rootless (Conmon, crun), usado a través de Docker CLI 29.9.0 y Docker Compose 5.6.0 |
| Puerto del frontend      | `BOOQI_FRONTEND_PORT=8088` (en `infra/.env` local, no versionado)                                |
| Destino de la suite real | `http://localhost:8088` (`E2E_REAL_BASE_URL` por defecto)                                        |
| Navegador                | Chromium de Playwright (escritorio)                                                              |

## Puertas de calidad

Todas las órdenes se ejecutaron en `frontend/` y terminaron con código de salida `0`.

`npm run lint`:

```text
> booqi@0.0.0 lint
> eslint .
```

`npm run format:check`:

```text
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
```

`npm run build`:

```text
dist/assets/react-C1iE8mnY.js                                    218.75 kB │ gzip:  68.27 kB
dist/assets/pdf-lib-Dgz79a9w.js                                  419.83 kB │ gzip: 175.54 kB

✓ built in 1.32s
```

`npm test`:

```text
 Test Files  85 passed (85)
      Tests  1086 passed (1086)
```

`npm run test:e2e` (suite simulada):

```text
  ✓  27 [chromium] › e2e/smoke.spec.ts:10:1 › the home page does not download the PDF or QR libraries (1.6s)
  ✓  25 [chromium] › e2e/shell.spec.ts:119:3 › motion allowed › page transitions slide vertically (3.1s)

  30 passed (33.0s)
```

`npm run test:e2e:real` (contra el stack de compose):

```text
  ✓  30 [chromium] › e2e-real/purchase.spec.ts:25:1 › an approved card confirms the booking and decreases the stock (3.3s)
  ✓  31 [chromium] › e2e-real/purchase.spec.ts:42:1 › a card ending in an odd digit cancels the booking and keeps the stock (3.4s)

  31 passed (1.2m)
```

## E2E contra el backend real

Los tres flujos obligatorios (salida del reporter `list`), con los datos creados por la propia ejecución a través de
la API pública y los efectos comprobados en el backend (estado de la reserva y stock del evento):

```text
✓   1 [chromium] › e2e-real/login.spec.ts:11:1 › a wrong password shows the Spanish message and stays on /login (832ms)
✓   2 [chromium] › e2e-real/login.spec.ts:20:1 › the customer follows the redirect to /my-bookings (681ms)
✓   3 [chromium] › e2e-real/login.spec.ts:29:1 › the seeded admin without redirect lands on /admin (707ms)
✓   4 [chromium] › e2e-real/my-bookings.spec.ts:19:1 › lists the approved and the rejected booking under the run event (6.3s)
✓  30 [chromium] › e2e-real/purchase.spec.ts:25:1 › an approved card confirms the booking and decreases the stock (3.3s)
✓  31 [chromium] › e2e-real/purchase.spec.ts:42:1 › a card ending in an odd digit cancels the booking and keeps the stock (3.4s)
```

La suite también pasó dos veces seguidas contra la misma base de datos sin `409` (datos únicos por ejecución).

## Verificación por flujo

Una fila por fila de [`FEATURE_PARITY.md`](FEATURE_PARITY.md), cada una comprobada por una prueba de
`e2e-real/parity.spec.ts` con el mismo nombre (la prueba `parity rows are all covered` falla si falta alguna). En
las filas `gap de backend` el veredicto se refiere a que la app trata el hueco con honestidad; el hueco sigue
abierto en el backend y está descrito en [`BACKEND_GAPS.md`](BACKEND_GAPS.md).

| Flujo                                    | Resultado | Motivo / evidencia                                                                                                                                                                                                           |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                      | funciona  | Solo enlaza eventos que existen en `GET /api/v1/events/{id}` (sin eventos ficticios)                                                                                                                                         |
| `/events`                                | funciona  | Filtra por texto y por categoría en la URL; añadir sin sesión lleva a `/login?redirect=…`                                                                                                                                    |
| `/events/:id`                            | funciona  | Precio, `Últimas 3 entradas`, selector acotado al stock; id inexistente → «Evento no encontrado»                                                                                                                             |
| `/cart`                                  | funciona  | +/−, total exacto (`25,00` → `37,50` → `25,00`), eliminar y «Ir al pago» → `/checkout`                                                                                                                                       |
| `/checkout`                              | funciona  | Tres pasos; con PayPal no pide tarjeta; reserva `CONFIRMED` y pago `PAYPAL` en la API                                                                                                                                        |
| `/login`                                 | funciona  | Validación local sin petición; `401` → «Email o contraseña incorrectos.»                                                                                                                                                     |
| `/register`                              | funciona  | Exige ≥ 8 caracteres como `CreateUserRequest`; crea un `CUSTOMER`; `409` → «Este email ya está registrado.»                                                                                                                  |
| `/admin`                                 | funciona  | Sin sesión → login; cliente → «Página no encontrada»; admin → panel con resumen y tres pestañas                                                                                                                              |
| `/contact`                               | funciona  | Insignia `Demo` y aviso de que no se envía nada; ninguna petición de escritura ([Formulario de contacto](BACKEND_GAPS.md#formulario-de-contacto))                                                                            |
| `/my-bookings`                           | funciona  | Sin sesión → login con redirección; reservas agrupadas por evento, canceladas marcadas `Cancelada`                                                                                                                           |
| Sesión de autenticación                  | funciona  | La sesión sobrevive a recargar y «Cerrar sesión» la borra                                                                                                                                                                    |
| Navegación por rol                       | funciona  | Anónimo: «Crear cuenta»; cliente: «Mis reservas», «Perfil» y carrito; admin: «Administración»                                                                                                                                |
| Carrito                                  | funciona  | Añadir dos veces suma cantidad en una línea; se pierde al recargar (como la app anterior)                                                                                                                                    |
| Checkout: reserva + pago                 | funciona  | Una línea pagada y otra cuyo evento se borró queda «No se pudo completar» y sigue en el carrito                                                                                                                              |
| Comisión de servicio                     | funciona  | Sin comisión: total mostrado `25,00` = `totalPrice` de reserva y pago ([Comisión de servicio](BACKEND_GAPS.md#comisión-de-servicio))                                                                                         |
| Confirmación por correo                  | funciona  | Ningún texto promete correos en la confirmación ni en `/contact` ([Envío de correos](BACKEND_GAPS.md#envío-de-correos))                                                                                                      |
| PDF de entradas                          | funciona  | PDF válido (`%PDF-`) desde la confirmación y desde «Mis reservas»                                                                                                                                                            |
| Previsualización de PDF                  | funciona  | Diálogo con `iframe` `blob:`, «Descargar» y cierre con `Escape`                                                                                                                                                              |
| Panel de ventas (admin)                  | funciona  | Pagos unidos a reservas, filtro por evento y estado, totales aprobado/rechazado                                                                                                                                              |
| Exportación de informe de evento (admin) | funciona  | «Informe de ventas · <evento>» previsualizado y descargado como PDF                                                                                                                                                          |
| Gestión de usuarios (admin)              | funciona  | Borrado con diálogo y toast; `GET /api/v1/users/{id}` → `404`; sin botón para uno mismo                                                                                                                                      |
| Gestión de eventos (admin)               | funciona  | Crear, editar (solo campos cambiados) y borrar con diálogo, comprobado en la API                                                                                                                                             |
| Mensajes de error de la API              | funciona  | El `409` muestra el `detail` del ProblemDetail dentro del diálogo, que no se cierra                                                                                                                                          |
| Autorización en servidor                 | funciona  | `/admin` bloqueado en el navegador sin descargar su código; el servidor sigue sin autorizar ([Autenticación por token y autorización en el servidor](BACKEND_GAPS.md#autenticación-por-token-y-autorización-en-el-servidor)) |

Defectos encontrados durante la verificación: sin defectos de frontend y sin huecos de backend nuevos. Los tres
fallos de la primera ejecución del recorrido eran de las propias pruebas (un selector de rol equivocado y una
navegación con recarga que vaciaba el carrito, que por diseño vive solo en memoria) y se corrigieron en ellas.

## Cómo reproducir

Desde la raíz del repositorio, con `infra/.env` copiado de `infra/.env.example` y `BOOQI_FRONTEND_PORT=8088`:

```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.override.yml --env-file infra/.env up -d --build
cd frontend
mkdir -p reports/delivery
for s in lint format:check build test test:e2e test:e2e:real; do npm run $s 2>&1 | tee reports/delivery/final-${s/:/-}.log; done
cd ..
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.override.yml --env-file infra/.env down -v
```

`npm run test:e2e:real` espera hasta 10 minutos a que `GET /api/v1/events` responda `200` (ver
[E2E contra el backend real](../README.md#e2e-contra-el-backend-real)).

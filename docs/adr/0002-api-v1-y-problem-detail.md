# 0002. API versionada `/api/v1` y errores ProblemDetail

- Estado: Aceptada
- Fecha: 2026-10-23

## Contexto y problema

Cada servicio exponía rutas propias sin versión (`/api/users/email/{email}`, borrado por email, búsquedas en rutas
distintas por criterio) y devolvía los errores de forma heterogénea: `IllegalStateException` convertida en `500`, `404`
con cuerpo vacío o sobres ad hoc del tipo `{success, message, user}`. El frontend tenía que conocer cada variante.

¿Qué contrato HTTP común deben seguir los cuatro servicios para recursos y errores?

## Decisión

- Recursos bajo `/api/v1/<plural>` (`/api/v1/users`, `/api/v1/events`, `/api/v1/bookings`, `/api/v1/payments`).
  - Identificador en la ruta para leer, actualizar y borrar: `/api/v1/<plural>/{id}`.
  - Creación con `201 Created` y cabecera `Location`.
  - Filtros como parámetros de consulta en `GET /api/v1/<plural>`. Son mutuamente excluyentes: el controlador los recoge
    en un record `<Svc>Filter` y el servicio decide la consulta; una combinación no permitida responde `400`.
  - Operaciones que no son CRUD como subrecursos con `PATCH` (`/stock`, `/confirm`, `/cancel`) o `POST /login`.
- Sin alias de las rutas antiguas: el frontend se actualiza en el mismo commit que cada servicio.
- Errores con **RFC 9457** (`application/problem+json`) mediante `ProblemDetail` de Spring:
  - `type` siempre `about:blank`, `title` el texto estándar del estado, `detail` el mensaje y `instance` la ruta de la
    petición.
  - Los errores de validación añaden la propiedad `errors`, una lista de `{field, message}`.
  - Un único `GlobalExceptionHandler` por servicio, idéntico en los cuatro salvo el paquete y dos extras permitidos
    (`401` de login en user-service, `503` por fallo remoto en booking-service y payment-service).

## Consecuencias

### Positivas

- El frontend y cualquier cliente tratan todos los errores con el mismo código (un único helper de mensajes).
- El prefijo `/api/v1` permite introducir una `v2` sin romper clientes y facilita el proxy por prefijo en nginx
  (ver [0005](0005-proxy-nginx-frontend.md)).
- Los mensajes internos de excepciones no previstas no se filtran: el `500` siempre dice `An unexpected error occurred`.

### Negativas

- Ruptura del contrato anterior: cualquier cliente externo de las rutas antiguas deja de funcionar.
- El manejador está duplicado en cuatro servicios (consecuencia de [0001](0001-reorganizacion-monorepo.md)).

## Alternativas consideradas

- **Rutas sin versión con alias de las antiguas.** Rechazada: mantener dos contratos duplica controladores y pruebas, y
  el único cliente (el frontend) se migra en el mismo cambio.
- **DTO de error propio** (`{code, message, timestamp}`). Rechazada: RFC 9457 es estándar, Spring lo soporta de forma
  nativa y los clientes HTTP genéricos ya lo entienden.
- **Una ruta de búsqueda por criterio** (`/users/email/{email}`, `/users/role/{role}`, …). Rechazada: multiplica los
  endpoints y no expresa la exclusión entre filtros; los parámetros de consulta sobre la colección son la forma REST
  habitual.

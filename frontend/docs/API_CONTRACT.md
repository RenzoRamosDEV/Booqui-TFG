# Contrato de la API de Booqi

Documento de referencia para implementar el nuevo frontend contra el backend actual sin leer el código Java. Todo lo que aparece aquí se ha extraído del código del repositorio en el commit `9b143c7`; lo que se deduce del comportamiento por defecto de Spring o Jackson, y no está escrito explícitamente en el código, se marca como _(inferido)_.

Fuentes principales:

- Controladores: `services/*-service/src/main/java/com/booqi/*/controller/*Controller.java`
- DTOs: `services/*-service/src/main/java/com/booqi/*/dto/{request,response}/*.java`
- Errores: `services/*-service/src/main/java/com/booqi/*/exception/GlobalExceptionHandler.java` y sus tests `services/*-service/src/test/java/com/booqi/*/exception/GlobalExceptionHandlerTest.java`
- Lógica que dispara errores: `services/*-service/src/main/java/com/booqi/*/service/impl/*ServiceImpl.java` y `services/{booking,payment}-service/.../client/*.java`
- CORS: `services/*-service/src/main/java/com/booqi/*/config/CorsConfig.java`
- Configuración: `services/*-service/src/main/resources/application{,-dev,-docker}.yml`, `infra/docker/docker-compose{,.override}.yml`, `infra/.env.example`
- Proxies del frontend: `frontend/vite.config.js`, `frontend/nginx.conf`, `frontend/.env.example`

## Índice

- [Cómo llega el frontend a cada servicio](#cómo-llega-el-frontend-a-cada-servicio)
- [Convenciones comunes](#convenciones-comunes)
- [Formato de error (ProblemDetail)](#formato-de-error-problemdetail)
- [Autenticación](#autenticación)
- [CORS](#cors)
- [user-service (`/api/v1/users`)](#user-service-apiv1users)
- [event-service (`/api/v1/events`)](#event-service-apiv1events)
- [booking-service (`/api/v1/bookings`)](#booking-service-apiv1bookings)
- [payment-service (`/api/v1/payments`)](#payment-service-apiv1payments)
- [Discrepancias con las especificaciones existentes](#discrepancias-con-las-especificaciones-existentes)

## Cómo llega el frontend a cada servicio

| Servicio        | Puerto (`server.port`) | Ruta base          | Fichero de configuración                                      |
| --------------- | ---------------------- | ------------------ | ------------------------------------------------------------- |
| user-service    | `8080`                 | `/api/v1/users`    | `services/user-service/src/main/resources/application.yml`    |
| event-service   | `8081`                 | `/api/v1/events`   | `services/event-service/src/main/resources/application.yml`   |
| booking-service | `8082`                 | `/api/v1/bookings` | `services/booking-service/src/main/resources/application.yml` |
| payment-service | `8083`                 | `/api/v1/payments` | `services/payment-service/src/main/resources/application.yml` |

- El frontend construye cada URL como `` `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/<recurso>` `` (`frontend/src/api/*Service.js`). Con `VITE_API_BASE_URL` vacío (valor de `frontend/.env.example`) las llamadas son relativas al mismo origen.
- **Desarrollo (`npm run dev`)**: el proxy de Vite (`frontend/vite.config.js`) reenvía `/api/v1/users` → `http://localhost:8080`, `/api/v1/events` → `http://localhost:8081`, `/api/v1/bookings` → `http://localhost:8082` y `/api/v1/payments` → `http://localhost:8083`. No usa `changeOrigin`, de modo que el `Host` reenviado coincide con el `Origin` del navegador.
- **Contenedor (`booqi-frontend`)**: nginx (`frontend/nginx.conf`) reenvía los mismos cuatro prefijos a `http://booqi-user-service:8080`, `http://booqi-event-service:8081`, `http://booqi-booking-service:8082` y `http://booqi-payment-service:8083`, con `Host $http_host`, `X-Real-IP`, `X-Forwarded-For` y `X-Forwarded-Proto`. El resto de rutas cae en `try_files $uri $uri/ /index.html` (fallback de SPA). El puerto publicado es `${BOOQI_FRONTEND_PORT:-80}:80` (`infra/docker/docker-compose.yml`).
- En el compose base solo se publican el frontend y MySQL (`3307:3306`). El override de desarrollo (`infra/docker/docker-compose.override.yml`) publica además `8080`–`8083` y activa los perfiles `docker,dev`.
- Cada servicio expone además `GET /actuator/health`, `GET /v3/api-docs` y `/swagger-ui.html` (`application.yml`); no forman parte del contrato de negocio y no se cuentan como endpoints aquí.

### Inventario de endpoints (20)

| Servicio | Endpoints | Métodos                                                                          |
| -------- | --------- | -------------------------------------------------------------------------------- |
| users    | 6         | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `POST /login`       |
| events   | 6         | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/stock` |
| bookings | 5         | `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}/confirm`, `PATCH /{id}/cancel`      |
| payments | 3         | `POST /`, `GET /`, `GET /{id}`                                                   |

No existen otros endpoints de negocio. En particular **no hay**: endpoint de contacto, envío de correos, recuperación de contraseña, tokens o sesiones, paginación, ordenación, actualización ni borrado de reservas o pagos, ni endpoints agregados de ventas o informes.

## Convenciones comunes

- Cuerpos JSON (`Content-Type: application/json`); respuestas de éxito `application/json`; errores `application/problem+json`.
- Los `id` son `Long` en la ruta. Un `id` no numérico devuelve `400` ProblemDetail (tests `pathVariableNoNumerica_retorna400SinTiposJava`).
- Los `POST` de creación responden `201 Created` con el recurso y la cabecera `Location: /api/v1/<recurso>/{id}`.
- Los `DELETE` responden `204 No Content` sin cuerpo.
- Los `PUT` son actualizaciones parciales: solo se aplican los campos no nulos (descripción `@Operation` "Only the non-null fields are applied").
- Los listados `GET /` aceptan como mucho **un** filtro por query string (excepción: `firstName` + `lastName` en usuarios). Los filtros en blanco se ignoran. Más de un filtro no vacío devuelve `400` con `detail` `Only one filter may be used at a time` (usuarios: `Only one filter may be used at a time (firstName and lastName may be combined)`).
- Un valor de filtro con tipo incorrecto (p. ej. `?userId=abc`) devuelve `400` con `errors: [{ "field": "userId", "message": "Invalid value for parameter 'userId'" }]`.
- Fechas: `LocalDate` como `YYYY-MM-DD`; `LocalDateTime` como `YYYY-MM-DDTHH:mm:ss`. En reservas y pagos el formato está fijado con `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")`; en usuarios y eventos se usa el formato ISO por defecto de Jackson, que puede incluir fracciones de segundo _(inferido)_.
- Importes: `price` de eventos es `Double`; `basePrice`/`totalPrice` de reservas y `totalPrice` de pagos son `BigDecimal` (número JSON).
- Los mensajes de validación (`errors[].message`) están en español; los `detail` de negocio están en inglés.
- Campos desconocidos en el cuerpo se ignoran (configuración por defecto de Spring Boot) _(inferido)_.

## Formato de error (ProblemDetail)

Todos los servicios devuelven errores con `application/problem+json` (RFC 9457). `spring.mvc.problemdetails.enabled: true` en cada `application.yml`; cada `GlobalExceptionHandler` extiende `ResponseEntityExceptionHandler` y fuerza `type = "about:blank"` también en los errores propios de Spring (`createResponseEntity`).

| Campo      | Tipo   | Contenido                                                                                        |
| ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| `type`     | string | Siempre `about:blank`                                                                            |
| `title`    | string | Frase estándar del código HTTP (`Bad Request`, `Not Found`, …) _(inferido)_                      |
| `status`   | number | Código HTTP                                                                                      |
| `detail`   | string | Mensaje legible (ver tablas por endpoint)                                                        |
| `instance` | string | Ruta de la petición, p. ej. `/api/v1/bookings/999` _(inferido; confirmado por specs existentes)_ |
| `errors`   | array  | Solo en errores de validación/binding: lista de `{ "field": string, "message": string }`         |

Correspondencia excepción → estado (idéntica en los cuatro servicios salvo donde se indica):

| Excepción                                                                                  | Estado | `detail`                                         | Servicios        |
| ------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------ | ---------------- |
| `MethodArgumentNotValidException` (Bean Validation del cuerpo o binding de query)          | `400`  | `Validation failed` + `errors`                   | todos            |
| `InvalidFilterException`                                                                   | `400`  | mensaje de filtro único                          | todos            |
| Cuerpo JSON mal formado, parámetro obligatorio ausente, tipo de ruta inválido _(inferido)_ | `400`  | texto por defecto de Spring                      | todos            |
| `InvalidCredentialsException`                                                              | `401`  | `Invalid email or password`                      | user-service     |
| `ResourceNotFoundException`                                                                | `404`  | `<Recurso> with id <id> not found`               | todos            |
| Método HTTP no soportado                                                                   | `405`  | texto por defecto de Spring                      | todos            |
| `ConflictException`                                                                        | `409`  | `<Recurso> with contactEmail <x> already exists` | user, event      |
| `BusinessException`                                                                        | `422`  | mensaje de la regla                              | todos            |
| `RemoteServiceException`                                                                   | `503`  | `<Servicio> service is unavailable`              | booking, payment |
| Cualquier otra `Exception`                                                                 | `500`  | `An unexpected error occurred`                   | todos            |

`ConflictException` está mapeada en booking y payment pero ningún método de esos servicios la lanza.

### Ejemplos por familia de estado

`400` validación (`handleMethodArgumentNotValid`):

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/bookings",
  "errors": [{ "field": "ticketQuantity", "message": "La cantidad de tickets debe ser al menos 1" }]
}
```

`400` filtro múltiple (`handleInvalidFilter`):

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Only one filter may be used at a time",
  "instance": "/api/v1/events"
}
```

`401` credenciales (`handleInvalidCredentials`, solo user-service):

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password",
  "instance": "/api/v1/users/login"
}
```

`404` (`handleNotFound`):

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Booking with id 999 not found",
  "instance": "/api/v1/bookings/999"
}
```

`409` (`handleConflict`):

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "User with contactEmail mel@booqi.com already exists",
  "instance": "/api/v1/users"
}
```

`422` (`handleBusiness`, `HttpStatus.UNPROCESSABLE_CONTENT`):

```json
{
  "type": "about:blank",
  "title": "Unprocessable Content",
  "status": 422,
  "detail": "End date cannot be before start date",
  "instance": "/api/v1/events"
}
```

`503` (`handleRemoteService`, booking y payment):

```json
{
  "type": "about:blank",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "User service is unavailable",
  "instance": "/api/v1/bookings"
}
```

`500` (`handleUnexpected`): `detail` siempre `An unexpected error occurred`, sin traza.

El frontend actual extrae el mensaje con `getErrorMessage` (`frontend/src/api/errorMessage.js`): primer valor no vacío entre `detail`, `message` y `error`, o un texto por defecto.

## Autenticación

- **Login**: `POST /api/v1/users/login` con `{ contactEmail, password }` (`LoginRequest`). Si el email existe y la contraseña coincide con el hash BCrypt almacenado (`PasswordEncoder`, `services/user-service/.../config/PasswordConfig.java`) responde `200` con un `UserResponse`.
- **Fallo**: email desconocido o contraseña incorrecta → `401` con el mismo `detail` `Invalid email or password` en ambos casos. Campos ausentes o email mal formado → `400` de validación.
- **Sin token ni sesión**: la respuesta no contiene token, no se emite cookie y ningún endpoint exige credenciales. No hay Spring Security en los servicios; cualquier cliente puede llamar a cualquier endpoint (incluidos los de administración y `PATCH /bookings/{id}/confirm`).
- **La contraseña nunca se devuelve**: `UserResponse` no tiene campo `password`. Los `toString()` de `CreateUserRequest`, `UpdateUserRequest`, `LoginRequest` y `CreatePaymentRequest` enmascaran contraseña, tarjeta y CVV como `***`.
- **Roles**: enum `User.Role { ADMIN, CUSTOMER }` (`services/user-service/.../entity/User.java`), serializado como string en `role`. Si `role` llega vacío o ausente al crear, se asigna `CUSTOMER` (`UserServiceImpl.create`).
- **Control de acceso por rol**: solo existe en el cliente. El frontend actual guarda el `UserResponse` en `localStorage['booqi_user']` (`frontend/src/context/AuthContext.jsx`) y oculta enlaces según `user.role === 'ADMIN'`. El backend no comprueba el rol en ninguna operación.

## CORS

Cada servicio registra la misma configuración (`services/*-service/.../config/CorsConfig.java`):

| Ajuste              | Valor                                                             |
| ------------------- | ----------------------------------------------------------------- |
| Mapeo               | `/**`                                                             |
| Orígenes permitidos | Propiedad `booqi.cors.allowed-origins` (lista separada por comas) |
| Métodos             | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`                |
| Cabeceras           | `Content-Type`, `Authorization`                                   |
| Credenciales        | No se configuran (por defecto desactivadas) _(inferido)_          |

Valores de `booqi.cors.allowed-origins`:

| Contexto                          | Valor                                                                         | Fuente                             |
| --------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| Por defecto (perfil base y `dev`) | `${BOOQI_CORS_ALLOWED_ORIGINS:http://localhost:5173}`                         | `application.yml` de cada servicio |
| Perfil `docker`                   | No lo redefine; hereda el de `application.yml`                                | `application-docker.yml`           |
| Compose                           | `BOOQI_CORS_ALLOWED_ORIGINS` obligatorio (`${BOOQI_CORS_ALLOWED_ORIGINS:?…}`) | `infra/docker/docker-compose.yml`  |
| Ejemplo de entorno                | `http://localhost,http://localhost:5173`                                      | `infra/.env.example`               |

Como Vite y nginx reenvían las peticiones al mismo origen, el navegador normalmente no necesita CORS; solo entra en juego si `VITE_API_BASE_URL` apunta a otro origen.

## user-service (`/api/v1/users`)

Puerto `8080`. Controlador `services/user-service/src/main/java/com/booqi/user/controller/UserController.java`.

| Método   | Ruta                  | Query                                                           | Cuerpo              | 2xx   | Errores             |
| -------- | --------------------- | --------------------------------------------------------------- | ------------------- | ----- | ------------------- |
| `POST`   | `/api/v1/users`       | —                                                               | `CreateUserRequest` | `201` | `400`, `409`        |
| `GET`    | `/api/v1/users`       | `contactEmail`, `contactPhone`, `role`, `firstName`, `lastName` | —                   | `200` | `400`               |
| `GET`    | `/api/v1/users/{id}`  | —                                                               | —                   | `200` | `400`, `404`        |
| `PUT`    | `/api/v1/users/{id}`  | —                                                               | `UpdateUserRequest` | `200` | `400`, `404`, `409` |
| `DELETE` | `/api/v1/users/{id}`  | —                                                               | —                   | `204` | `400`, `404`        |
| `POST`   | `/api/v1/users/login` | —                                                               | `LoginRequest`      | `200` | `400`, `401`        |

### `UserResponse`

| Campo          | Tipo                     | Notas                  |
| -------------- | ------------------------ | ---------------------- |
| `id`           | number (`Long`)          |                        |
| `firstName`    | string                   |                        |
| `lastName`     | string                   |                        |
| `dateOfBirth`  | string (`LocalDate`)     | `YYYY-MM-DD`           |
| `contactPhone` | string \| null           |                        |
| `contactEmail` | string                   | Único                  |
| `role`         | string                   | `ADMIN` \| `CUSTOMER`  |
| `createdAt`    | string (`LocalDateTime`) | Fijado por el servidor |
| `updatedAt`    | string (`LocalDateTime`) | Fijado por el servidor |

### `POST /api/v1/users` — crear usuario

Cuerpo `CreateUserRequest`:

| Campo          | Tipo                | Obligatorio | Restricciones y mensaje                                                                                        |
| -------------- | ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `firstName`    | string              | sí          | `@NotBlank` "El nombre es obligatorio"; `@Size(2,50)` "El nombre debe tener entre 2 y 50 caracteres"           |
| `lastName`     | string              | sí          | `@NotBlank` "El apellido es obligatorio"; `@Size(2,50)` "El apellido debe tener entre 2 y 50 caracteres"       |
| `dateOfBirth`  | string `YYYY-MM-DD` | sí          | `@NotNull` "La fecha de nacimiento es obligatoria"; `@Past` "La fecha de nacimiento debe ser una fecha pasada" |
| `contactPhone` | string              | no          | `@Pattern ^\+?[0-9]{9,15}$` "El teléfono debe tener entre 9 y 15 dígitos"                                      |
| `contactEmail` | string              | sí          | `@NotBlank` "El email es obligatorio"; `@Email` "El email debe ser válido"                                     |
| `password`     | string              | sí          | `@NotBlank` "La contraseña es obligatoria"; `@Size(min=8)` "La contraseña debe tener al menos 8 caracteres"    |
| `role`         | string              | no          | `@Pattern ADMIN\|CUSTOMER` "El rol debe ser ADMIN o CUSTOMER"; vacío o ausente → `CUSTOMER`                    |

Respuesta `201` con `UserResponse` y `Location: /api/v1/users/{id}`. La contraseña se guarda con hash BCrypt.

| Estado | Disparador                                                               |
| ------ | ------------------------------------------------------------------------ |
| `400`  | Validación fallida o cuerpo mal formado                                  |
| `409`  | `contactEmail` ya usado: `User with contactEmail <email> already exists` |

Nota: el endpoint acepta `role: "ADMIN"` de cualquier cliente; no hay restricción en servidor.

### `GET /api/v1/users` — listar usuarios

Query `UserFilter` (todos opcionales; uno a la vez salvo `firstName` + `lastName`):

| Parámetro      | Coincidencia                                                |
| -------------- | ----------------------------------------------------------- |
| `contactEmail` | Exacta; devuelve lista de 0 o 1 elementos                   |
| `contactPhone` | Exacta                                                      |
| `role`         | Sin distinguir mayúsculas; un rol desconocido devuelve `[]` |
| `firstName`    | Valor completo, sin distinguir mayúsculas                   |
| `lastName`     | Valor completo, sin distinguir mayúsculas                   |

Sin filtros devuelve todos. Respuesta `200` con `UserResponse[]` (posiblemente vacío).

| Estado | Disparador                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| `400`  | Más de un filtro no vacío: `Only one filter may be used at a time (firstName and lastName may be combined)` |

### `GET /api/v1/users/{id}` — obtener usuario

Respuesta `200` con `UserResponse`.

| Estado | Disparador                    |
| ------ | ----------------------------- |
| `400`  | `id` no numérico              |
| `404`  | `User with id <id> not found` |

### `PUT /api/v1/users/{id}` — actualizar usuario

Cuerpo `UpdateUserRequest`: todos los campos opcionales; los nulos no se modifican.

| Campo          | Tipo                | Restricciones y mensaje                                                                        |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `firstName`    | string              | `@Size(2,50)` "El nombre debe tener entre 2 y 50 caracteres"                                   |
| `lastName`     | string              | `@Size(2,50)` "El apellido debe tener entre 2 y 50 caracteres"                                 |
| `dateOfBirth`  | string `YYYY-MM-DD` | `@Past` "La fecha de nacimiento debe ser una fecha pasada"                                     |
| `contactPhone` | string              | `@Pattern ^\+?[0-9]{9,15}$` "El teléfono debe tener entre 10 y 15 dígitos"                     |
| `contactEmail` | string              | `@Email` "El correo electrónico debe ser válido"                                               |
| `password`     | string              | `@Size(min=8)` "La contraseña debe tener al menos 8 caracteres"; si no está vacía se re-hashea |
| `role`         | string              | `@Pattern ADMIN\|CUSTOMER` "El rol debe ser ADMIN o CUSTOMER"; solo se aplica si no está vacío |

Respuesta `200` con `UserResponse`.

| Estado | Disparador                                                           |
| ------ | -------------------------------------------------------------------- |
| `400`  | Validación fallida, cuerpo mal formado o `id` no numérico            |
| `404`  | `User with id <id> not found`                                        |
| `409`  | Nuevo `contactEmail` distinto del actual y ya usado por otro usuario |

### `DELETE /api/v1/users/{id}` — borrar usuario

Respuesta `204` sin cuerpo. No borra reservas ni pagos asociados (bases de datos separadas).

| Estado | Disparador                    |
| ------ | ----------------------------- |
| `400`  | `id` no numérico              |
| `404`  | `User with id <id> not found` |

### `POST /api/v1/users/login` — iniciar sesión

Cuerpo `LoginRequest`:

| Campo          | Tipo   | Obligatorio | Restricciones y mensaje                                                    |
| -------------- | ------ | ----------- | -------------------------------------------------------------------------- |
| `contactEmail` | string | sí          | `@NotBlank` "El email es obligatorio"; `@Email` "El email debe ser válido" |
| `password`     | string | sí          | `@NotBlank` "La contraseña es obligatoria"                                 |

Respuesta `200` con `UserResponse` (sin token). Ver [Autenticación](#autenticación).

| Estado | Disparador                                                             |
| ------ | ---------------------------------------------------------------------- |
| `400`  | Campo ausente o email mal formado                                      |
| `401`  | Email inexistente o contraseña incorrecta: `Invalid email or password` |

## event-service (`/api/v1/events`)

Puerto `8081`. Controlador `services/event-service/src/main/java/com/booqi/event/controller/EventController.java`.

| Método   | Ruta                        | Query                                                        | Cuerpo               | 2xx   | Errores                    |
| -------- | --------------------------- | ------------------------------------------------------------ | -------------------- | ----- | -------------------------- |
| `POST`   | `/api/v1/events`            | —                                                            | `CreateEventRequest` | `201` | `400`, `409`, `422`        |
| `GET`    | `/api/v1/events`            | `contactEmail`, `title`, `category`, `location`, `organizer` | —                    | `200` | `400`                      |
| `GET`    | `/api/v1/events/{id}`       | —                                                            | —                    | `200` | `400`, `404`               |
| `PUT`    | `/api/v1/events/{id}`       | —                                                            | `UpdateEventRequest` | `200` | `400`, `404`, `409`, `422` |
| `DELETE` | `/api/v1/events/{id}`       | —                                                            | —                    | `204` | `400`, `404`               |
| `PATCH`  | `/api/v1/events/{id}/stock` | `quantity` (obligatorio)                                     | —                    | `200` | `400`, `404`, `422`        |

### `EventResponse`

| Campo              | Tipo                     | Notas                     |
| ------------------ | ------------------------ | ------------------------- |
| `id`               | number (`Long`)          |                           |
| `title`            | string                   |                           |
| `description`      | string \| null           |                           |
| `availableTickets` | number (`Integer`)       | Stock actual              |
| `location`         | string                   |                           |
| `startDate`        | string (`LocalDateTime`) |                           |
| `endDate`          | string (`LocalDateTime`) |                           |
| `organizer`        | string                   |                           |
| `price`            | number (`Double`)        | Euros; `0` = gratuito     |
| `category`         | string                   | Texto libre (no hay enum) |
| `contactEmail`     | string                   | Único entre eventos       |
| `contactPhone`     | string                   |                           |
| `imageUrl`         | string \| null           |                           |
| `createdAt`        | string (`LocalDateTime`) |                           |
| `updatedAt`        | string (`LocalDateTime`) |                           |

### `POST /api/v1/events` — crear evento

Cuerpo `CreateEventRequest`:

| Campo              | Tipo                   | Obligatorio | Restricciones y mensaje                                                                                                          |
| ------------------ | ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `title`            | string                 | sí          | `@NotBlank` "El título es obligatorio"; `@Size(3,200)` "El título debe tener entre 3 y 200 caracteres"                           |
| `description`      | string                 | no          | `@Size(max=2000)` "La descripción no puede exceder 2000 caracteres"                                                              |
| `availableTickets` | number (`Integer`)     | sí          | `@NotNull` "El número de tickets disponibles es obligatorio"; `@Min(0)` "El número de tickets no puede ser negativo"             |
| `location`         | string                 | sí          | `@NotBlank` "La ubicación es obligatoria"; `@Size(3,200)` "La ubicación debe tener entre 3 y 200 caracteres"                     |
| `startDate`        | string `LocalDateTime` | sí          | `@NotNull` "La fecha de inicio es obligatoria"; `@Future` "La fecha de inicio debe ser en el futuro"                             |
| `endDate`          | string `LocalDateTime` | sí          | `@NotNull` "La fecha de fin es obligatoria"                                                                                      |
| `organizer`        | string                 | sí          | `@NotBlank` "El organizador es obligatorio"; `@Size(3,100)` "El organizador debe tener entre 3 y 100 caracteres"                 |
| `price`            | number (`Double`)      | sí          | `@NotNull` "El precio es obligatorio"; `@DecimalMin("0.0")` "El precio no puede ser negativo"                                    |
| `category`         | string                 | sí          | `@NotBlank` "La categoría es obligatoria"; `@Size(3,50)` "La categoría debe tener entre 3 y 50 caracteres"                       |
| `contactEmail`     | string                 | sí          | `@NotBlank` "El email de contacto es obligatorio"; `@Email` "El email de contacto debe ser válido"                               |
| `contactPhone`     | string                 | sí          | `@NotBlank` "El teléfono de contacto es obligatorio"; `@Pattern ^\+?[0-9]{9,15}$` "El teléfono debe tener entre 10 y 15 dígitos" |
| `imageUrl`         | string                 | no          | `@Pattern` URL `^(https?://)?([\w.-]+)\.([a-z]{2,})(:\d+)?(/.*)?$` o vacío; "La URL de la imagen debe ser válida"                |

Respuesta `201` con `EventResponse` y `Location: /api/v1/events/{id}`.

| Estado | Disparador                                                                |
| ------ | ------------------------------------------------------------------------- |
| `400`  | Validación fallida o cuerpo mal formado                                   |
| `409`  | `contactEmail` ya usado: `Event with contactEmail <email> already exists` |
| `422`  | `endDate` anterior a `startDate`: `End date cannot be before start date`  |

### `GET /api/v1/events` — listar eventos

Query `EventFilter` (todos opcionales; solo uno a la vez):

| Parámetro      | Coincidencia                        |
| -------------- | ----------------------------------- |
| `contactEmail` | Exacta; lista de 0 o 1 elementos    |
| `title`        | Contiene, sin distinguir mayúsculas |
| `category`     | Igual, sin distinguir mayúsculas    |
| `location`     | Contiene, sin distinguir mayúsculas |
| `organizer`    | Contiene, sin distinguir mayúsculas |

Sin filtros devuelve todos. No hay filtro por fecha, precio ni disponibilidad, ni combinación de filtros. Respuesta `200` con `EventResponse[]`.

| Estado | Disparador                                                         |
| ------ | ------------------------------------------------------------------ |
| `400`  | Más de un filtro no vacío: `Only one filter may be used at a time` |

### `GET /api/v1/events/{id}` — obtener evento

Respuesta `200` con `EventResponse`.

| Estado | Disparador                     |
| ------ | ------------------------------ |
| `400`  | `id` no numérico               |
| `404`  | `Event with id <id> not found` |

### `PUT /api/v1/events/{id}` — actualizar evento

Cuerpo `UpdateEventRequest`: mismos campos que la creación, todos opcionales; los nulos no se modifican.

| Campo              | Restricciones y mensaje                                 |
| ------------------ | ------------------------------------------------------- |
| `title`            | `@Size(3,200)`                                          |
| `description`      | `@Size(max=2000)`                                       |
| `availableTickets` | `@Min(0)` "El número de tickets no puede ser negativo"  |
| `location`         | `@Size(3,200)`                                          |
| `startDate`        | Sin `@Future`                                           |
| `endDate`          | —                                                       |
| `organizer`        | `@Size(3,100)`                                          |
| `price`            | `@DecimalMin("0.0")`                                    |
| `category`         | `@Size(3,50)`                                           |
| `contactEmail`     | `@Email` "El email de contacto debe ser válido"         |
| `contactPhone`     | `@Pattern ^\+?[0-9]{9,15}$`                             |
| `imageUrl`         | Sin validación de formato (a diferencia de la creación) |

Respuesta `200` con `EventResponse`.

| Estado | Disparador                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Validación fallida (incluido `availableTickets` negativo), cuerpo mal formado o `id` no numérico                                                                                |
| `404`  | `Event with id <id> not found`                                                                                                                                                  |
| `409`  | Nuevo `contactEmail` distinto del actual y ya usado                                                                                                                             |
| `422`  | Fechas fuera de orden: `End date cannot be before start date`, `New start date cannot be after the existing end date` o `New end date cannot be before the existing start date` |

### `DELETE /api/v1/events/{id}` — borrar evento

Respuesta `204` sin cuerpo. No afecta a reservas ni pagos existentes.

| Estado | Disparador                     |
| ------ | ------------------------------ |
| `400`  | `id` no numérico               |
| `404`  | `Event with id <id> not found` |

### `PATCH /api/v1/events/{id}/stock?quantity={n}` — descontar stock

Pensado para uso interno de payment-service (`services/payment-service/.../client/EventClient.java`); el frontend no lo llama. Sin cuerpo. Resta `n` a `availableTickets` y responde `200` con `EventResponse`.

| Estado | Disparador                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `quantity` ausente o no numérico, o `id` no numérico                                                                                                                                          |
| `404`  | `Event with id <id> not found`                                                                                                                                                                |
| `422`  | `quantity` ≤ 0: `Quantity must be greater than zero`; stock insuficiente: `Insufficient stock for event <id>: available <a>, requested <n>`; stock nulo: `Event <id> has no stock configured` |

## booking-service (`/api/v1/bookings`)

Puerto `8082`. Controlador `services/booking-service/src/main/java/com/booqi/booking/controller/BookingController.java`. Llama a user-service y event-service con `RestClient` (timeouts: conexión 2 s, lectura 5 s, `RestClientConfig.java`).

| Método  | Ruta                            | Query                         | Cuerpo                 | 2xx   | Errores                    |
| ------- | ------------------------------- | ----------------------------- | ---------------------- | ----- | -------------------------- |
| `POST`  | `/api/v1/bookings`              | —                             | `CreateBookingRequest` | `201` | `400`, `404`, `422`, `503` |
| `GET`   | `/api/v1/bookings`              | `userId`, `eventId`, `status` | —                      | `200` | `400`                      |
| `GET`   | `/api/v1/bookings/{id}`         | —                             | —                      | `200` | `400`, `404`               |
| `PATCH` | `/api/v1/bookings/{id}/confirm` | —                             | —                      | `200` | `400`, `404`               |
| `PATCH` | `/api/v1/bookings/{id}/cancel`  | —                             | —                      | `200` | `400`, `404`               |

### `BookingResponse`

| Campo              | Tipo                         | Notas                                         |
| ------------------ | ---------------------------- | --------------------------------------------- |
| `id`               | number (`Long`)              |                                               |
| `userId`           | number (`Long`)              |                                               |
| `userFirstName`    | string                       | Copia del usuario al reservar                 |
| `userLastName`     | string                       | Copia del usuario al reservar                 |
| `userEmail`        | string                       | Copia de `contactEmail` del usuario           |
| `eventId`          | number (`Long`)              |                                               |
| `eventTitle`       | string                       | Copia del evento al reservar                  |
| `eventDescription` | string \| null               | Copia del evento al reservar                  |
| `eventStartDate`   | string `yyyy-MM-ddTHH:mm:ss` | Copia del evento al reservar                  |
| `eventLocation`    | string                       | Copia del evento al reservar                  |
| `ticketQuantity`   | number (`Integer`)           |                                               |
| `basePrice`        | number (`BigDecimal`)        | `price` del evento                            |
| `totalPrice`       | number (`BigDecimal`)        | `basePrice × ticketQuantity` (sin comisiones) |
| `status`           | string                       | `PENDING` \| `CONFIRMED` \| `CANCELLED`       |
| `createdAt`        | string `yyyy-MM-ddTHH:mm:ss` |                                               |
| `updatedAt`        | string `yyyy-MM-ddTHH:mm:ss` |                                               |

No incluye imagen del evento, `endDate`, categoría ni identificador de pago.

### `POST /api/v1/bookings` — crear reserva

Cuerpo `CreateBookingRequest` (cualquier otro campo se ignora):

| Campo            | Tipo               | Obligatorio | Restricciones y mensaje                                                                                  |
| ---------------- | ------------------ | ----------- | -------------------------------------------------------------------------------------------------------- |
| `userId`         | number (`Long`)    | sí          | `@NotNull` "El ID del usuario es requerido"                                                              |
| `eventId`        | number (`Long`)    | sí          | `@NotNull` "El ID del evento es requerido"                                                               |
| `ticketQuantity` | number (`Integer`) | sí          | `@NotNull` "La cantidad de tickets es requerida"; `@Min(1)` "La cantidad de tickets debe ser al menos 1" |

Lee el usuario (`GET /api/v1/users/{id}`) y el evento (`GET /api/v1/events/{id}`), guarda una copia de sus datos, calcula precios y crea la reserva con `status` `PENDING`. **No** comprueba stock, fecha del evento ni duplicados, y **no** descuenta stock (eso ocurre al aprobar el pago). Respuesta `201` con `BookingResponse` y `Location: /api/v1/bookings/{id}`.

| Estado | Disparador (`RemoteErrorHandler`)                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Validación fallida o cuerpo mal formado (no se llama a ningún servicio)                                                       |
| `404`  | El usuario o el evento no existen; `detail` = `detail` remoto (p. ej. `User with id 99 not found`)                            |
| `422`  | El servicio remoto responde otro 4xx; `detail` remoto o `<target> service rejected the request with status <n>`               |
| `503`  | Servicio remoto con 5xx, inaccesible o sin respuesta a tiempo: `User service is unavailable` / `Event service is unavailable` |

### `GET /api/v1/bookings` — listar reservas

Query `BookingFilter` (todos opcionales; solo uno a la vez):

| Parámetro | Tipo            | Coincidencia                                                       |
| --------- | --------------- | ------------------------------------------------------------------ |
| `userId`  | number (`Long`) | Exacta                                                             |
| `eventId` | number (`Long`) | Exacta                                                             |
| `status`  | string          | Exacta (distingue mayúsculas): `PENDING`, `CONFIRMED`, `CANCELLED` |

Sin filtros devuelve todas. Respuesta `200` con `BookingResponse[]`.

| Estado | Disparador                                                             |
| ------ | ---------------------------------------------------------------------- |
| `400`  | Más de un filtro no vacío; `userId`/`eventId` no numérico (`errors[]`) |

### `GET /api/v1/bookings/{id}` — obtener reserva

Respuesta `200` con `BookingResponse`.

| Estado | Disparador                       |
| ------ | -------------------------------- |
| `400`  | `id` no numérico                 |
| `404`  | `Booking with id <id> not found` |

### `PATCH /api/v1/bookings/{id}/confirm` y `PATCH /api/v1/bookings/{id}/cancel`

Pensados para uso interno de payment-service (`services/payment-service/.../client/BookingClient.java`); el frontend no los llama. Sin cuerpo. Cambian `status` a `CONFIRMED` o `CANCELLED` y responden `200` con `BookingResponse`. Si ya estaba en el estado destino se devuelve sin cambios. No hay validación de transiciones (una reserva `CANCELLED` puede pasar a `CONFIRMED` y viceversa).

| Estado | Disparador                       |
| ------ | -------------------------------- |
| `400`  | `id` no numérico                 |
| `404`  | `Booking with id <id> not found` |

## payment-service (`/api/v1/payments`)

Puerto `8083`. Controlador `services/payment-service/src/main/java/com/booqi/payment/controller/PaymentController.java`. Llama a event-service y booking-service con `RestClient` (timeouts: conexión 2 s, lectura 5 s).

| Método | Ruta                    | Query                                      | Cuerpo                 | 2xx   | Errores      |
| ------ | ----------------------- | ------------------------------------------ | ---------------------- | ----- | ------------ |
| `POST` | `/api/v1/payments`      | —                                          | `CreatePaymentRequest` | `201` | `400`, `422` |
| `GET`  | `/api/v1/payments`      | `userId`, `eventId`, `bookingId`, `status` | —                      | `200` | `400`        |
| `GET`  | `/api/v1/payments/{id}` | —                                          | —                      | `200` | `400`, `404` |

### `PaymentResponse`

| Campo            | Tipo                         | Notas                                                        |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| `id`             | number (`Long`)              |                                                              |
| `bookingId`      | number (`Long`)              |                                                              |
| `userId`         | number (`Long`)              |                                                              |
| `eventId`        | number (`Long`)              |                                                              |
| `ticketQuantity` | number (`Integer`)           |                                                              |
| `totalPrice`     | number (`BigDecimal`)        | El enviado por el cliente                                    |
| `paymentMethod`  | string                       | `CREDIT_CARD` \| `DEBIT_CARD` \| `PAYPAL` \| `BANK_TRANSFER` |
| `status`         | string                       | `APPROVED` \| `REJECTED` (`PENDING` solo transitorio)        |
| `transactionId`  | string \| null               | UUID; solo si `APPROVED`                                     |
| `errorMessage`   | string \| null               | Motivo si `REJECTED`                                         |
| `paymentDate`    | string `yyyy-MM-ddTHH:mm:ss` |                                                              |
| `createdAt`      | string `yyyy-MM-ddTHH:mm:ss` |                                                              |
| `updatedAt`      | string `yyyy-MM-ddTHH:mm:ss` |                                                              |

Nunca incluye número de tarjeta ni CVV.

### `POST /api/v1/payments` — procesar pago (simulado)

Cuerpo `CreatePaymentRequest`:

| Campo            | Tipo                  | Obligatorio | Restricciones y mensaje                                                                                                          |
| ---------------- | --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `bookingId`      | number (`Long`)       | sí          | `@NotNull` "El ID de la reserva es requerido"                                                                                    |
| `userId`         | number (`Long`)       | sí          | `@NotNull` "El ID del usuario es requerido"                                                                                      |
| `eventId`        | number (`Long`)       | sí          | `@NotNull` "El ID del evento es requerido"                                                                                       |
| `ticketQuantity` | number (`Integer`)    | sí          | `@NotNull` "La cantidad de tickets es requerida"; `@Min(1)` "La cantidad de tickets debe ser al menos 1"                         |
| `totalPrice`     | number (`BigDecimal`) | sí          | `@NotNull` "El precio total es requerido"; `@Min(0)` "El precio total debe ser mayor o igual a 0"; máximo `99999999.99` (422)    |
| `paymentMethod`  | string                | sí          | `@NotNull` "El método de pago es requerido"; `@Pattern CREDIT_CARD\|DEBIT_CARD\|PAYPAL\|BANK_TRANSFER` "Método de pago inválido" |
| `cardNumber`     | string                | no          | Solo simulación; nunca se almacena                                                                                               |
| `cvv`            | string                | no          | Solo simulación; nunca se almacena ni se usa                                                                                     |

Secuencia (`PaymentServiceImpl.process`):

1. Si `totalPrice > 99999999.99` → `422` `Total price must not exceed 99999999.99` sin guardar nada.
2. Guarda el pago como `PENDING`.
3. Simula la aprobación (espera ~500 ms). Aprueba si `cardNumber` es nulo o vacío, o si su último carácter tiene valor numérico par; rechaza si es impar (p. ej. `4111111111111111` → rechazado).
4. **Aprobado**: `PATCH /api/v1/events/{eventId}/stock?quantity={ticketQuantity}`, después `PATCH /api/v1/bookings/{bookingId}/confirm`; el pago queda `APPROVED` con `transactionId` y `paymentDate`.
5. **Rechazado por simulación**: el pago queda `REJECTED` con `errorMessage` `Payment rejected by simulation` y se llama a `PATCH /api/v1/bookings/{bookingId}/cancel`.
6. **Fallo remoto** en el paso 4 o 5 (evento o reserva inexistente, stock insuficiente, servicio caído o timeout): el pago queda `REJECTED` con `errorMessage` = motivo (p. ej. `Insufficient stock for event 3: available 4, requested 5`) y se intenta cancelar la reserva sin propagar errores.

Respuesta siempre `201` con `PaymentResponse` y `Location: /api/v1/payments/{id}` cuando pasa la validación, **tanto si el pago es `APPROVED` como `REJECTED`**. El cliente debe leer `status`.

| Estado | Disparador                                                              |
| ------ | ----------------------------------------------------------------------- |
| `400`  | Validación fallida o cuerpo mal formado                                 |
| `422`  | `totalPrice` > `99999999.99`: `Total price must not exceed 99999999.99` |

Observaciones del código:

- No se comprueba que `bookingId`, `userId`, `eventId`, `ticketQuantity` y `totalPrice` sean coherentes con la reserva: el servidor confía en el cliente.
- Si el descuento de stock tiene éxito pero falla la confirmación de la reserva (p. ej. `bookingId` inexistente), el stock queda descontado y el pago `REJECTED` _(inferido del orden de llamadas)_.
- `503` y `404` no se devuelven en este endpoint: los fallos remotos se convierten en un pago `REJECTED`.

### `GET /api/v1/payments` — listar pagos

Query `PaymentFilter` (todos opcionales; solo uno a la vez):

| Parámetro   | Tipo            | Coincidencia                                                     |
| ----------- | --------------- | ---------------------------------------------------------------- |
| `userId`    | number (`Long`) | Exacta                                                           |
| `eventId`   | number (`Long`) | Exacta                                                           |
| `bookingId` | number (`Long`) | Exacta                                                           |
| `status`    | string          | Exacta (distingue mayúsculas): `APPROVED`, `REJECTED`, `PENDING` |

Sin filtros devuelve todos. Respuesta `200` con `PaymentResponse[]`.

| Estado | Disparador                                                                         |
| ------ | ---------------------------------------------------------------------------------- |
| `400`  | Más de un filtro no vacío; `userId`/`eventId`/`bookingId` no numérico (`errors[]`) |

### `GET /api/v1/payments/{id}` — obtener pago

Respuesta `200` con `PaymentResponse`.

| Estado | Disparador                       |
| ------ | -------------------------------- |
| `400`  | `id` no numérico                 |
| `404`  | `Payment with id <id> not found` |

## Discrepancias con las especificaciones existentes

Las especificaciones de `openspec/specs/` se usaron solo como contraste; en caso de diferencia manda el código.

| Tema                                            | Especificación                                                  | Código (gana)                                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `availableTickets` negativo en `PUT` de eventos | `event-management`: 422 "reaching the service"                  | `@Min(0)` en `UpdateEventRequest` lo rechaza antes con `400`; la comprobación `422` del servicio es inalcanzable vía HTTP. El `@ApiResponse` 422 "negative tickets" del controlador también es engañoso. |
| Mensaje de teléfono                             | `user-management`/`event-management`: patrón `^\+?[0-9]{9,15}$` | El patrón coincide, pero varios mensajes dicen "entre 10 y 15 dígitos" (`UpdateUserRequest`, `CreateEventRequest`, `UpdateEventRequest`).                                                                |

No se encontraron otras discrepancias en estados, campos de respuesta, filtros, CORS ni rutas.

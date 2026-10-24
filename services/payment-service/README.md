# payment-service

Booqi payment service: simulated processing and lookup of payments for bookings. An approved payment decrements the
event stock in event-service and confirms the booking in booking-service; a rejected one cancels the booking.
Spring Boot 4 / Java 17, MySQL, listening on port **8083**.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `dev` (SQL logging, DEBUG), `docker` (compose MySQL host and service hostnames) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3307/payment` (`docker` profile: `jdbc:mysql://mysql:3306/payment`) | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `booqi` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | _(empty)_ | DB password |
| `BOOQI_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |
| `BOOQI_EVENT_SERVICE_URL` | `http://localhost:8081` (`docker` profile: `http://event-service:8081`) | event-service base URL (no path) |
| `BOOQI_BOOKING_SERVICE_URL` | `http://localhost:8082` (`docker` profile: `http://booking-service:8082`) | booking-service base URL (no path) |

The schema is owned by `infra/db/init/001_init_database.sql`; Hibernate only validates it (`ddl-auto: validate`).

## Processing

`POST /api/v1/payments` stores the payment as `PENDING`, waits 500 ms and simulates the charge:

| Card number | Outcome |
|---|---|
| absent or empty | approved |
| last digit even | approved |
| last digit odd | rejected (`errorMessage` = `Payment rejected by simulation`), booking cancelled |

On approval it calls `PATCH /api/v1/events/{eventId}/stock?quantity={ticketQuantity}` and then
`PATCH /api/v1/bookings/{bookingId}/confirm` through `RestClient` (JDK HTTP client, 2 s connect timeout, 5 s read
timeout, no retries), then marks the payment `APPROVED` with a `transactionId`. If either remote call fails (404, 4xx
such as insufficient stock, 5xx, timeout or connection refused), the payment is stored as `REJECTED` with the remote
reason in `errorMessage` and the booking is cancelled on a best-effort basis. Both outcomes answer `201`.

A `totalPrice` above `99999999.99` (the `DECIMAL(10,2)` column) is refused with `422` before anything is stored.

Card number and CVV are only used for the simulation: they are never stored, never returned and never logged
(the request's `toString` masks them).

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/api/v1/payments` | 201 + Location (`APPROVED` or `REJECTED`) | 400, 422 |
| GET | `/api/v1/payments[?userId\|eventId\|bookingId\|status]` | 200 | 400 |
| GET | `/api/v1/payments/{id}` | 200 | 404 |
| GET | `/actuator/health` (also `/liveness`, `/readiness`) | 200 | |
| GET | `/v3/api-docs` | 200 | |
| GET | `/swagger-ui.html` | 200 | |

List filters are mutually exclusive; blank values are ignored. `status` matches exactly.
Errors are RFC 9457 `application/problem+json` bodies; validation errors add an `errors` list of `{field, message}`.

## Run

Standalone against the compose MySQL (`make up` or `docker compose -f infra/docker/docker-compose.yml up -d mysql`),
with event-service and booking-service reachable on their default ports:

```bash
SPRING_DATASOURCE_USERNAME=root SPRING_DATASOURCE_PASSWORD=<MYSQL_ROOT_PASSWORD> \
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Container: `docker build -t booqi/payment-service .` (multi-stage, runs as non-root `booqi`, healthcheck on `/actuator/health`).

## Tests

```bash
./mvnw test                                                   # unit, slice, HTTP-client and H2 tests
./mvnw test-compile org.pitest:pitest-maven:mutationCoverage  # mutation testing (target/pit-reports)
```

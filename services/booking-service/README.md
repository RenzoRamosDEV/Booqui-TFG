# booking-service

Booqi booking service: creation, lookup, filtering, confirmation and cancellation of bookings. A booking stores a
snapshot of the user (read from user-service) and of the event (read from event-service) at creation time.
Spring Boot 4 / Java 17, MySQL, listening on port **8082**.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `dev` (SQL logging, DEBUG), `docker` (compose MySQL host and service hostnames) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3307/booking` (`docker` profile: `jdbc:mysql://booqi-mysql:3306/booking`) | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `booqi` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | _(empty)_ | DB password |
| `BOOQI_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |
| `BOOQI_USER_SERVICE_URL` | `http://localhost:8080` (`docker` profile: `http://booqi-user-service:8080`) | user-service base URL (no path) |
| `BOOQI_EVENT_SERVICE_URL` | `http://localhost:8081` (`docker` profile: `http://booqi-event-service:8081`) | event-service base URL (no path) |

The schema is owned by `infra/db/init/001_init_database.sql`; Hibernate only validates it (`ddl-auto: validate`).
In compose, `infra/docker/docker-compose.yml` sets these variables explicitly, so the `docker` profile defaults
only apply when the profile is used outside it.

## Remote calls

`POST /api/v1/bookings` reads `GET /api/v1/users/{id}` and then `GET /api/v1/events/{id}` through `RestClient`
(JDK HTTP client, 2 s connect timeout, 5 s read timeout, no retries). Remote failures are mapped as follows, and no
booking is stored:

| Remote outcome | Booking response |
|---|---|
| 404 | 404 (remote `detail` forwarded when present) |
| 409, 422 or any other 4xx | 422 (remote `detail` forwarded when present) |
| 5xx, timeout, connection refused | 503 |

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/api/v1/bookings` | 201 + Location | 400, 404, 422, 503 |
| GET | `/api/v1/bookings[?userId\|eventId\|status]` | 200 | 400 |
| GET | `/api/v1/bookings/{id}` | 200 | 404 |
| PATCH | `/api/v1/bookings/{id}/confirm` | 200 | 404 |
| PATCH | `/api/v1/bookings/{id}/cancel` | 200 | 404 |
| GET | `/actuator/health` (also `/liveness`, `/readiness`) | 200 | |
| GET | `/v3/api-docs` | 200 | |
| GET | `/swagger-ui.html` | 200 | |

List filters are mutually exclusive; blank values are ignored. `status` matches exactly.
Confirm and cancel return the booking; a booking already in the target status is returned unchanged.
Errors are RFC 9457 `application/problem+json` bodies; validation errors add an `errors` list of `{field, message}`.

## Run

Standalone against the compose MySQL. `make up` starts the whole stack, including this service in a container on
the same port, so to run it from source start only MySQL from the repository root:

```bash
docker compose -f infra/docker/docker-compose.yml --env-file infra/.env up -d booqi-mysql
```

Then, from `services/booking-service`, with the default DB user `booqi` (`BOOQI_DB_USER`) and
user-service and event-service reachable on their default ports:

```bash
SPRING_DATASOURCE_PASSWORD=<BOOQI_DB_PASSWORD> ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Container: `docker build -t booqi/booking-service .` (multi-stage, runs as non-root `booqi`, healthcheck on `/actuator/health`).

## Tests

```bash
./mvnw test                                                   # unit, slice, HTTP-client and H2 tests
./mvnw test-compile org.pitest:pitest-maven:mutationCoverage  # mutation testing (target/pit-reports)
```

## See also

[Root README](../../README.md) · [Architecture](../../docs/architecture.md)

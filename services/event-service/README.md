# event-service

Booqi event management service: creation, lookup, filtering, update, deletion and ticket-stock management of events.
Spring Boot 4 / Java 17, MySQL, listening on port **8081**.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `dev` (SQL logging, DEBUG), `docker` (compose MySQL host) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3307/event` (`docker` profile: `jdbc:mysql://booqi-mysql:3306/event`) | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `booqi` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | _(empty)_ | DB password |
| `BOOQI_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |

The schema is owned by `infra/db/init/001_init_database.sql`; Hibernate only validates it (`ddl-auto: validate`).
In compose, `infra/docker/docker-compose.yml` sets these variables explicitly, so the `docker` profile defaults
only apply when the profile is used outside it.

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/api/v1/events` | 201 + Location | 400, 409, 422 |
| GET | `/api/v1/events[?contactEmail\|title\|category\|location\|organizer]` | 200 | 400 |
| GET | `/api/v1/events/{id}` | 200 | 404 |
| PUT | `/api/v1/events/{id}` | 200 | 400, 404, 409, 422 |
| DELETE | `/api/v1/events/{id}` | 204 | 404 |
| PATCH | `/api/v1/events/{id}/stock?quantity=` | 200 | 400, 404, 422 |
| GET | `/actuator/health` (also `/liveness`, `/readiness`) | 200 | |
| GET | `/v3/api-docs` | 200 | |
| GET | `/swagger-ui.html` | 200 | |

List filters are mutually exclusive; blank values are ignored. `contactEmail` matches exactly, `category` ignoring case,
and `title`, `location` and `organizer` by substring ignoring case.
Errors are RFC 9457 `application/problem+json` bodies; validation errors add an `errors` list of `{field, message}`.
Business-rule violations (end date before start date, negative tickets on update, non-positive or insufficient
stock quantity) answer 422.

## Run

Standalone against the compose MySQL. `make up` starts the whole stack, including this service in a container on
the same port, so to run it from source start only MySQL from the repository root:

```bash
docker compose -f infra/docker/docker-compose.yml --env-file infra/.env up -d booqi-mysql
```

Then, from `services/event-service`, with the default DB user `booqi` (`BOOQI_DB_USER`):

```bash
SPRING_DATASOURCE_PASSWORD=<BOOQI_DB_PASSWORD> ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Container: `docker build -t booqi/event-service .` (multi-stage, runs as non-root `booqi`, healthcheck on `/actuator/health`).

## Tests

```bash
./mvnw test                                                   # unit, slice and H2 tests
./mvnw test-compile org.pitest:pitest-maven:mutationCoverage  # mutation testing (target/pit-reports)
```

## See also

[Root README](../../README.md) · [Architecture](../../docs/architecture.md)

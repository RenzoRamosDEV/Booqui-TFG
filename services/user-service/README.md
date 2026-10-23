# user-service

Booqi user management service: registration, lookup, update, deletion and login of users.
Spring Boot 4 / Java 17, MySQL, listening on port **8080**.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `dev` (SQL logging, DEBUG), `docker` (compose MySQL host) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3307/user` (`docker` profile: `jdbc:mysql://mysql:3306/user`) | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `booqi` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | _(empty)_ | DB password |
| `BOOQI_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |

The schema is owned by `infra/db/init/001_init_database.sql`; Hibernate only validates it (`ddl-auto: validate`).
Passwords are stored as BCrypt hashes (cost 10).

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/api/v1/users` | 201 + Location | 400, 409 |
| GET | `/api/v1/users[?contactEmail\|contactPhone\|role\|firstName[&lastName]\|lastName]` | 200 | 400 |
| GET | `/api/v1/users/{id}` | 200 | 404 |
| PUT | `/api/v1/users/{id}` | 200 | 400, 404, 409 |
| DELETE | `/api/v1/users/{id}` | 204 | 404 |
| POST | `/api/v1/users/login` | 200 | 400, 401 |
| GET | `/actuator/health` (also `/liveness`, `/readiness`) | 200 | |
| GET | `/v3/api-docs` | 200 | |
| GET | `/swagger-ui.html` | 200 | |

List filters are mutually exclusive (only `firstName` + `lastName` may be combined); blank values are ignored.
Errors are RFC 9457 `application/problem+json` bodies; validation errors add an `errors` list of `{field, message}`.

## Run

Standalone against the compose MySQL (`make up` or `docker compose -f infra/docker/docker-compose.yml up -d mysql`):

```bash
SPRING_DATASOURCE_USERNAME=root SPRING_DATASOURCE_PASSWORD=<MYSQL_ROOT_PASSWORD> \
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Container: `docker build -t booqi/user-service .` (multi-stage, runs as non-root `booqi`, healthcheck on `/actuator/health`).

## Tests

```bash
./mvnw test                                                   # unit, slice and H2 tests
./mvnw test-compile org.pitest:pitest-maven:mutationCoverage  # mutation testing (target/pit-reports)
```

# Guía de contribución

Gracias por contribuir a Booqi. Esta guía resume cómo trabajar en el repositorio para que los cambios sean coherentes con
la arquitectura descrita en [docs/architecture.md](docs/architecture.md) y las decisiones de [docs/adr/](docs/adr/README.md).

## Requisitos

- **JDK 17** con `JAVA_HOME` apuntando a él (los servicios compilan con `--release 17`; cada uno trae su `./mvnw`, no hace
  falta Maven instalado).
- **Node 22** para `frontend/` (ejecuta `npm ci` la primera vez). `landing/` es HTML, CSS y JS estáticos y no necesita
  instalar nada; sus pruebas se lanzan desde `frontend/` con `npm run test:landing`.
- **Docker o Podman** con Compose v2 o superior para levantar el stack (`make up`).

## Ramas

- Formato `<type>/<kebab-case>`, por ejemplo `feat/filtro-eventos-por-fecha` o `fix/mensaje-telefono`.
- Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`, `style`.
- Nunca se hace commit directamente en `main`: todo entra mediante pull request.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/) **en español**: `<type>(<scope>): <descripción>`.
- Descripción en imperativo, de menos de 72 caracteres y sin punto final.
- Commits pequeños y atómicos: un cambio lógico por commit.
- Ejemplos del historial:
  - `refactor(user): normalizar estructura, API v1 y buenas prácticas`
  - `fix(frontend): enrutar la API por proxy y restaurar index.css`
  - `ci: añadir workflow unificado de build, test y lint`

## TDD obligatorio

Todo cambio de comportamiento sigue **red → green → refactor**:

1. **Red.** Escribe primero una prueba que falle por el motivo correcto. No se escribe código de producción sin una
   prueba que falle.
2. **Green.** Escribe el código mínimo que la hace pasar, sin romper las demás.
3. **Refactor.** Mejora la estructura sin cambiar el comportamiento, ejecutando las pruebas tras cada paso.

Diseño de pruebas:

- Elige las entradas por **particiones de equivalencia** y **valores límite**, y añade casos de error probables.
- Dobles de prueba, por orden de preferencia: **fakes** → **mocks/stubs** → **spies** → **Testcontainers** solo como
  último recurso. En los servicios se usan `@WebMvcTest` para controladores, `@DataJpaTest` con H2 para repositorios y
  Mockito para la capa de servicio.
- **Mutation testing** sobre las clases modificadas, con un objetivo de más del 95 % de mutantes eliminados (justifica
  los supervivientes):

  ```bash
  cd services/<svc>-service
  ./mvnw test-compile org.pitest:pitest-maven:mutationCoverage
  ```

  El `pom.xml` de cada servicio limita las clases mutadas a `controller`, `service.impl`, `exception`, `config` (y
  `client` donde existe). Revisa en el informe (`target/pit-reports/`) las clases que has modificado.

## Antes de abrir un pull request

```bash
make lint test
```

- Si tocas `frontend/`, ejecuta además `npm test` dentro de `frontend/`.
- Si tocas `infra/docker/`, ejecuta `make compose-config`.
- La CI (`.github/workflows/ci.yml`) debe quedar en verde: compila, prueba y valida formato de los cuatro servicios con
  Java 17, ejecuta lint, formato, build y pruebas de los frontends con Node 22 y valida la configuración de compose.

## Formato

- `make format` aplica el formato en todo el repositorio:
  - servicios: spotless con google-java-format (estilo AOSP); checkstyle se ejecuta en `./mvnw verify`.
  - frontends: prettier y ESLint (`npm run format`, `npm run lint`).
- `.editorconfig` fija UTF-8, LF, salto de línea final y la indentación por tipo de fichero.
- El commit de formato masivo está en `.git-blame-ignore-revs`. Para que `git blame` lo ignore:

  ```bash
  git config blame.ignoreRevsFile .git-blame-ignore-revs
  ```

## Cómo añadir un endpoint

Sigue la plantilla de servicio descrita en [docs/architecture.md](docs/architecture.md#plantilla-de-servicio):

1. **DTO.** Records de petición y respuesta en `dto/request/` y `dto/response/`, con Bean Validation en la petición.
   Si la petición lleva datos sensibles, sobrescribe `toString` para enmascararlos.
2. **Servicio.** Declara el método en la interfaz de `service/` y escribe primero la prueba de `service/impl/` (Mockito).
   Las reglas de negocio y los errores van aquí, lanzando las excepciones existentes de `exception/`
   (`ResourceNotFoundException` 404, `ConflictException` 409, `BusinessException` 422, `InvalidFilterException` 400).
3. **Repositorio.** Si necesitas una consulta, usa una consulta derivada de Spring Data y pruébala con `@DataJpaTest`.
4. **Controlador.** Añade el método en `controller/` bajo `/api/v1/<plural>`, con `@Valid` y el estado correcto
   (`201` con cabecera `Location` al crear, `204` al borrar). Nunca construyas cuerpos de error en el controlador: el
   `GlobalExceptionHandler` los genera como ProblemDetail. Pruébalo con `@WebMvcTest` y documenta la operación con las
   anotaciones OpenAPI.
5. **Frontend.** Añade la llamada en el módulo correspondiente de `frontend/src/api/`, usando rutas relativas
   `/api/v1/...`.
6. **Documentación.** Actualiza la tabla de endpoints del `README.md` del servicio.
7. **Esquema.** Los cambios de tablas van en `infra/db/init/001_init_database.sql` (no hay Flyway). Recrea el volumen
   con `make clean` y `make up` para aplicarlos.

Si el cambio es una decisión de arquitectura, añade un ADR en [docs/adr/](docs/adr/README.md).

## Seguridad

- Nunca subas `infra/.env`, ficheros `.env` ni credenciales reales. Usa `infra/.env.example` como plantilla.
- Las credenciales de demo del `README.md` son datos semilla de la base de datos local, no secretos.

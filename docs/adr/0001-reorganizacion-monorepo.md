# 0001. Reorganización del monorepo

- Estado: Aceptada
- Fecha: 2026-10-23

## Contexto y problema

El repositorio mezclaba en la raíz los cuatro microservicios (`user/`, `event/`, `booking/`, `payment/`), los dos
frontends (`front/`, `front-demo/`), el despliegue (`deployment-booqi/`), capturas sueltas (`assets/`), un build antiguo
de GitHub Pages en `docs/`, notas en `issues/`, un `.gitlab-ci.yml` sin uso y un fichero `REPO ORIGINAL`. Cada servicio
tenía su propio paquete (`org.service_user.user`, …) y su propio `.gitignore`. No había un punto de entrada común para
construir, probar o levantar el sistema, y los nombres no seguían ninguna convención.

¿Cómo organizar el repositorio para que sea fácil de entender, construir y extender sin acoplar los servicios entre sí?

## Decisión

- Estructura de primer nivel: `services/`, `frontend/`, `frontend-demo/`, `infra/` (`docker/`, `db/init/`,
  `.env.example`) y `docs/` (`assets/screenshots/`, `notes/`), más un `Makefile` POSIX en la raíz.
- `services/pom.xml` es **solo un agregador** (`packaging pom`, cuatro `<module>`, sin herencia). Cada servicio conserva
  `spring-boot-starter-parent` como padre y su propio `mvnw`, de modo que se puede construir de forma independiente desde
  su carpeta o todos juntos desde `services/`.
- Convenciones de nombres: groupId `com.booqi`, paquete raíz `com.booqi.<svc>`, artifactId `<svc>-service`, carpeta
  `services/<svc>-service`.
- **Sin módulo `booqi-common`.** Las piezas compartidas (manejador de errores, excepciones, configuración CORS/OpenAPI)
  se duplican de forma idéntica en cada servicio; la identidad se comprueba con `diff` módulo el nombre de paquete.
- Todos los movimientos se hacen con `git mv` para conservar el historial.
- Se eliminan `.gitlab-ci.yml`, el build antiguo de Pages y `REPO ORIGINAL` (la URL del repositorio original queda en el
  `README.md`); `issues/` pasa a `docs/notes/`; los `.gitignore` de cada módulo se absorben en el de la raíz.

## Consecuencias

### Positivas

- Un recién llegado encuentra cada pieza en un sitio predecible y puede usar `make up`, `make test` o `make lint` desde
  la raíz.
- Los servicios siguen siendo desplegables y versionables por separado: no comparten padre Maven ni librería.
- El historial de cada fichero se conserva (`git log --follow`).

### Negativas

- El código común está repetido cuatro veces; un cambio en el manejador de errores debe aplicarse en los cuatro servicios
  y verificarse con `diff`.
- Las versiones de dependencias y plugins se declaran en cada `pom.xml`; mantenerlas alineadas es manual.

## Alternativas consideradas

- **POM padre con herencia** (`services/pom.xml` como padre de los cuatro). Rechazada: obliga a reemplazar
  `spring-boot-starter-parent` o encadenarlo, y acopla la construcción de todos los servicios a un único fichero.
- **Módulo compartido `booqi-common`.** Rechazada: introduce una dependencia binaria entre servicios que deberían ser
  independientes y exige publicar o instalar el artefacto antes de construir cualquier servicio; el volumen de código
  compartido es pequeño.
- **Repositorios separados por servicio.** Rechazada: para un TFG con un único equipo multiplica la gestión (CI, ramas,
  versiones) sin beneficio y dificulta los cambios transversales, como la migración a `/api/v1`.

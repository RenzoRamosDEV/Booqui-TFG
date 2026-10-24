# 0003. Arquitectura en capas planas por servicio

- Estado: Aceptada
- Fecha: 2026-10-23

## Contexto y problema

Los servicios seguían una variante de puertos y adaptadores: tres modelos por entidad (DTO → modelo de repositorio →
modelo JPA), una interfaz de repositorio como puerto implementada por un adaptador JPA con métodos `default` y mappers
estáticos entre cada par de modelos. Para servicios que son esencialmente CRUD, cada campo nuevo obligaba a tocar tres
clases y dos mappers, y la estructura variaba de un servicio a otro.

¿Qué estructura interna común deben tener los servicios para que sean simples de leer y de extender?

## Decisión

- Capas planas `controller/` → `service/` (interfaz + `impl/`) → `repository/` (Spring Data JPA), con `entity/` para
  las entidades JPA.
- DTO como **records** en `dto/request/` y `dto/response/`; conversión con **MapStruct** en `mapper/`.
- `exception/` con las excepciones de dominio y el `GlobalExceptionHandler`; `config/` con CORS, auditoría JPA, OpenAPI y,
  donde aplica, `RestClient` o `PasswordEncoder`; `client/` solo en los servicios que llaman a otros (booking y payment).
- Se eliminan el modelo intermedio de repositorio, la interfaz puerto y el adaptador.
- La plantilla completa está en [docs/architecture.md](../architecture.md#plantilla-de-servicio).

## Consecuencias

### Positivas

- Un campo nuevo toca la entidad, el DTO y, como mucho, el mapper; MapStruct detecta en compilación las propiedades sin
  mapear.
- Los cuatro servicios comparten exactamente la misma estructura, así que lo aprendido en uno sirve para los demás.
- Las pruebas se organizan por capa con los *slices* de Spring (`@WebMvcTest`, `@DataJpaTest`) y Mockito en el servicio.

### Negativas

- La lógica de dominio queda acoplada a las entidades JPA y a Spring Data; cambiar de tecnología de persistencia
  implicaría tocar la capa de servicio. Se acepta porque los servicios son de tamaño CRUD.
- No hay un modelo de dominio rico: las reglas viven en los `*ServiceImpl`.

## Alternativas consideradas

- **Hexagonal (puertos y adaptadores) tal como estaba.** Rechazada: su beneficio (aislar el dominio de la
  infraestructura) no compensa en servicios casi sin lógica de dominio, y el coste en clases y mappers triplicados era
  alto y estaba aplicado de forma inconsistente.
- **Transaction script sin interfaz de servicio** (el controlador llama directamente a una clase con la lógica).
  Rechazada: la interfaz `service/` es el punto que mockean las pruebas del controlador y documenta el contrato de cada
  servicio.

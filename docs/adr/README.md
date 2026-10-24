# Registro de decisiones de arquitectura (ADR)

Decisiones relevantes de Booqi, en formato [MADR](https://adr.github.io/madr/). Cada ADR describe el contexto, la
decisión, sus consecuencias y las alternativas descartadas.

| Nº | Decisión | Estado |
|---|---|---|
| 0001 | [Reorganización del monorepo](0001-reorganizacion-monorepo.md) | Aceptada |
| 0002 | [API versionada `/api/v1` y errores ProblemDetail](0002-api-v1-y-problem-detail.md) | Aceptada |
| 0003 | [Arquitectura en capas planas por servicio](0003-arquitectura-en-capas.md) | Aceptada |
| 0004 | [Contraseñas con BCrypt y endpoint de login](0004-bcrypt-y-login.md) | Aceptada |
| 0005 | [Proxy de la API en el frontend (nginx y Vite)](0005-proxy-nginx-frontend.md) | Aceptada |

## Cómo añadir un ADR

1. Copia el ADR más reciente como `NNNN-titulo-en-kebab-case.md` con el siguiente número libre y rellena Estado, Fecha,
   Contexto y problema, Decisión, Consecuencias (positivas y negativas) y Alternativas consideradas.
2. Añade la fila a esta tabla. Un ADR no se reescribe: si una decisión cambia, crea uno nuevo y marca el anterior como
   `Sustituida por NNNN`.

Volver al [README principal](../../README.md) · [Arquitectura](../architecture.md)

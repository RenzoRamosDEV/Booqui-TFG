# 0004. Contraseñas con BCrypt y endpoint de login

- Estado: Aceptada
- Fecha: 2026-10-23

## Contexto y problema

user-service guardaba las contraseñas en texto plano (también en los datos semilla) y el login comparaba con `equals`.
El frontend ni siquiera usaba ese login: buscaba el usuario por email y lo daba por autenticado sin comprobar la
contraseña. Los `toString` de los DTO podían volcar la contraseña a los logs.

¿Cómo almacenar y verificar contraseñas de forma segura sin rehacer toda la seguridad del sistema?

## Decisión

- Hash con `BCryptPasswordEncoder(10)` de `spring-security-crypto`, declarado en `config/PasswordConfig`. Solo la
  librería de cifrado: **no** se añade la cadena de filtros de Spring Security.
- `POST /api/v1/users/login` recibe `{contactEmail, password}` y responde `200` con el `UserResponse` (sin contraseña) o
  `401` con un mensaje genérico (`Invalid email or password`), igual si falla el email o la contraseña.
- Las contraseñas de los datos semilla se re-hashean manteniendo los mismos textos planos, para que las credenciales de
  demo sigan funcionando.
- Los records de petición enmascaran la contraseña en `toString` (`password=***`).
- El frontend usa el login real y guarda el usuario devuelto.

## Consecuencias

### Positivas

- Ninguna contraseña se guarda ni se registra en claro; una fuga de la base de datos no expone las contraseñas
  directamente.
- El mensaje de error genérico no revela si un email está registrado.

### Negativas

- Sigue **sin autenticación en el servidor**: no hay token ni sesión, y ningún endpoint comprueba quién llama. La
  autorización (por ejemplo, el panel de administración) solo existe en el cliente. Está recogido en
  [Limitaciones conocidas](../architecture.md#limitaciones-conocidas).
- El coste de BCrypt (factor 10) añade unas decenas de milisegundos a cada login y alta.

## Alternativas consideradas

- **Spring Security completo con JWT.** Rechazada en esta fase: exige autenticar y autorizar en los cuatro servicios,
  propagar el token entre ellos y rehacer el frontend; queda como trabajo pendiente.
- **Mantener la comparación en texto plano.** Rechazada: es inaceptable incluso en un proyecto académico.

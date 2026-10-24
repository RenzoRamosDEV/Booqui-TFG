# Huecos del backend

Lo que la interfaz necesita y el backend actual no ofrece, con su impacto en la UI y cómo lo resuelve (o no) el
frontend. Los hechos del backend salen de [`API_CONTRACT.md`](API_CONTRACT.md); ningún hueco se tapa fingiendo que
el servidor hace algo que no hace. Lo que se simula en el navegador vive en `src/mocks/`, empieza con un comentario
`// MOCK: <hueco>` y se muestra con una insignia `Demo`.

## Autenticación por token y autorización en el servidor

- **Backend**: el login devuelve un `UserResponse` sin token ni cookie y ningún endpoint exige credenciales ni
  comprueba el rol ([Autenticación](API_CONTRACT.md#autenticación)). Cualquier cliente puede llamar a los
  endpoints de administración, crear usuarios `ADMIN` o confirmar reservas.
- **Impacto en la UI**: la sesión es el usuario guardado en `localStorage`; el panel `/admin` solo está protegido
  en el navegador.
- **Solución en el frontend**: guards de ruta (`RequireAuth`) que no montan ni descargan el código protegido y que
  redirigen al login; es experiencia de usuario, no seguridad. El registro siempre envía `role: "CUSTOMER"`.

## Recuperación de contraseña

- **Backend**: no existe ningún endpoint de recuperación ni de envío de correos
  ([Inventario de endpoints](API_CONTRACT.md#inventario-de-endpoints-20)).
- **Impacto en la UI**: no hay enlace «¿Has olvidado tu contraseña?».
- **Solución en el frontend**: ninguna; con la sesión iniciada se puede cambiar la contraseña desde `/profile`.

## Paginación y filtros combinados en el servidor

- **Backend**: `GET /api/v1/events` no pagina y acepta como mucho un filtro por petición; no filtra por fecha ni
  precio ([GET /api/v1/events](API_CONTRACT.md#get-apiv1events--listar-eventos)).
- **Impacto en la UI**: cada visita descarga el catálogo completo.
- **Solución en el frontend**: una sola petición sin parámetros, compartida por portada, listado y administración
  (TanStack Query), con filtros combinados (texto, categoría, ciudad, fechas, precio máximo) y paginación de 12 en
  el navegador y su estado en la URL.

## QR de entrada verificable

- **Backend**: no genera ni valida ningún código de entrada; `BookingResponse` no tiene campo de QR
  ([BookingResponse](API_CONTRACT.md#bookingresponse)).
- **Impacto en la UI**: el QR no sirve como control de acceso real.
- **Solución en el frontend**: el QR se genera en el navegador con `qrcode` y codifica solo el id de la reserva en
  decimal; las entradas PDF se generan con `pdf-lib` en el cliente.

## Gestión de reservas fuera de los pagos

- **Backend**: `PATCH /api/v1/bookings/{id}/cancel` está pensado para uso interno de payment-service, no valida
  transiciones (una reserva `CANCELLED` puede volver a `CONFIRMED`), y cancelar una reserva confirmada no devuelve
  el stock ni reembolsa nada. Un pago rechazado cancela su reserva, así que reintentar crea otra reserva nueva
  ([PATCH confirm/cancel](API_CONTRACT.md#patch-apiv1bookingsidconfirm-y-patch-apiv1bookingsidcancel),
  [POST /api/v1/payments](API_CONTRACT.md#post-apiv1payments--procesar-pago-simulado)).
- **Impacto en la UI**: «Mis reservas» puede acumular reservas canceladas de intentos fallidos; cancelar no libera
  entradas.
- **Solución en el frontend**: la cancelación solo se ofrece para reservas no canceladas y siempre con un diálogo
  que avisa de que no se devuelve el importe; las canceladas no generan entradas y no suman en los totales.

## Formulario de contacto

- **Backend**: no hay endpoint de contacto ([Inventario de endpoints](API_CONTRACT.md#inventario-de-endpoints-20)).
- **Impacto en la UI**: los mensajes no llegan a nadie.
- **Solución en el frontend**: `src/mocks/contact.ts` (`// MOCK: sin endpoint de contacto`) simula el envío en el
  navegador y `/contact` muestra una insignia `Demo` que dice que los mensajes no se envían.

## Envío de correos

- **Backend**: no envía correos de ningún tipo.
- **Impacto en la UI**: no se pueden mandar las entradas ni confirmaciones por correo.
- **Solución en el frontend**: se han eliminado todos los textos que lo prometían (confirmación de compra y
  contacto); las entradas se descargan desde la confirmación y desde «Mis reservas».

## Comisión de servicio

- **Backend**: `totalPrice` de la reserva es `basePrice × ticketQuantity`, sin comisiones
  ([BookingResponse](API_CONTRACT.md#bookingresponse)).
- **Impacto en la UI**: la app anterior mostraba una comisión que nunca se cobraba.
- **Solución en el frontend**: eliminada; el total mostrado es exactamente el `totalPrice` que se envía.

## `totalPrice` confiado al cliente

- **Backend**: payment-service no comprueba que `bookingId`, `eventId`, `ticketQuantity` y `totalPrice` sean
  coherentes con la reserva; solo rechaza importes mayores que `99999999.99`
  ([POST /api/v1/payments](API_CONTRACT.md#post-apiv1payments--procesar-pago-simulado)).
- **Impacto en la UI**: cualquier cliente podría pagar otro importe.
- **Solución en el frontend**: el importe se calcula en céntimos con la misma función que lo muestra
  (`src/lib/money.ts`), así que lo enviado coincide con lo visto; no puede impedir clientes manipulados.

## `POST /bookings` no comprueba el stock

- **Backend**: crear una reserva no comprueba stock, fecha ni duplicados; el stock solo se descuenta al aprobar el
  pago ([POST /api/v1/bookings](API_CONTRACT.md#post-apiv1bookings--crear-reserva)).
- **Impacto en la UI**: se puede reservar un evento agotado; el pago fallará después con un `REJECTED`.
- **Solución en el frontend**: el selector de cantidad y el carrito limitan a `min(availableTickets, 10)` y los
  eventos agotados no se pueden añadir; el rechazo posterior se muestra por línea.

## Stock descontado y no restaurado si falla la confirmación

- **Backend**: al aprobar un pago se descuenta el stock y después se confirma la reserva; si la confirmación falla,
  el pago queda `REJECTED` y el stock sigue descontado
  ([POST /api/v1/payments](API_CONTRACT.md#post-apiv1payments--procesar-pago-simulado)).
- **Impacto en la UI**: el stock mostrado puede ser menor que el real.
- **Solución en el frontend**: ninguna; tras el checkout se recargan eventos y reservas para mostrar el estado del
  servidor.

## Datos que faltan en las respuestas y agregados de ventas

- **Backend**: `BookingResponse` no incluye imagen, fecha de fin, categoría ni id de pago, y no hay endpoints de
  informes o ventas agregadas ([BookingResponse](API_CONTRACT.md#bookingresponse)).
- **Impacto en la UI**: «Mis reservas» no muestra la imagen del evento; el panel de ventas necesita dos listados
  completos.
- **Solución en el frontend**: el panel une `GET /api/v1/payments` con `GET /api/v1/bookings` por id de reserva
  (tolera pagos sin reserva) y calcula totales e informes PDF en el navegador.

## Campos opcionales que no se pueden vaciar

- **Backend**: los `PUT` solo aplican los campos no nulos ([Convenciones comunes](API_CONTRACT.md#convenciones-comunes)).
- **Impacto en la UI**: no se puede borrar el teléfono del perfil ni la descripción o la imagen de un evento.
- **Solución en el frontend**: los formularios de edición envían solo los campos cambiados y nunca cadenas vacías.

## Texto de la semilla doblemente codificado

- **Backend / datos**: algunos textos de la semilla de la base de datos llegan doblemente codificados (por ejemplo
  `GastronomÃ­a` en lugar de `Gastronomía`). Es un problema de `infra/db`, fuera del alcance de este frontend.
- **Impacto en la UI**: esas categorías no coinciden con la lista fija, así que no aparecen al filtrar por
  categoría y se muestran tal cual.
- **Solución en el frontend**: ninguna (no se «arreglan» datos en el cliente); el filtro funciona con datos bien
  codificados.

# Resumen de entrega del frontend

Qué entrega la reescritura del frontend de Booqi, por qué está hecho así, qué queda pendiente y cómo se ve cada
pantalla. La evidencia de que funciona contra el backend real está en [`VERIFICATION.md`](VERIFICATION.md); el
inventario de comportamientos que había que conservar, en [`FEATURE_PARITY.md`](FEATURE_PARITY.md); y lo que el
backend no ofrece, en [`BACKEND_GAPS.md`](BACKEND_GAPS.md). El detalle técnico vive en el
[`README.md`](../README.md) del frontend.

## Qué se hizo

- **Base**: la app React + Bootstrap en JavaScript se sustituyó por React 19 + TypeScript estricto con Vite,
  Tailwind v4, React Router (rutas `lazy`), TanStack Query, Zustand, React Hook Form + Zod y Motion. Cliente HTTP
  único que normaliza los errores ProblemDetail del backend, sesión persistida validada al rehidratar y guards de
  ruta por sesión y por rol.
- **Sistema de diseño**: tokens CSS para tema claro y oscuro con escala morada de marca, tema sin parpadeo que
  sigue al sistema operativo hasta que el usuario elige, componentes UI propios accesibles (diálogos con foco
  atrapado, panel lateral, pestañas, toasts) y animaciones que respetan el movimiento reducido.
- **Pantallas**: portada, listado de eventos con filtros combinados y paginación en la URL, detalle, carrito,
  checkout en tres pasos con resultado por línea, login, registro, perfil, «Mis reservas», contacto, panel de
  administración (usuarios, eventos y ventas con informe PDF), página no encontrada, error de ruta y sin conexión.
- **Entradas**: un único módulo genera en el navegador las entradas PDF y los QR, usado desde la confirmación de
  compra y desde «Mis reservas».
- **Landing**: página estática en `landing/` con capturas de la app en claro y oscuro, publicada en GitHub Pages.
- **Calidad**: 1086 pruebas unitarias y de componentes (Vitest), 30 E2E con la API simulada (la puerta de CI),
  mutation testing con Stryker y, en esta entrega, una suite E2E contra el stack real de compose: los flujos de
  login, compra y «Mis reservas», más un recorrido con una comprobación por cada fila de `FEATURE_PARITY.md`. Las
  24 filas funcionan contra el backend real (ver [`VERIFICATION.md`](VERIFICATION.md)).

## Decisiones de diseño

- **TypeScript estricto y Zod en los bordes**: los datos del backend y de `localStorage` se validan al entrar; así
  un cambio del contrato falla en un sitio conocido y no a mitad de una pantalla.
- **Filtrado y paginación en el cliente**: el backend no pagina y solo acepta un filtro por petición, así que se
  descarga el catálogo una vez (compartido por portada, listado y administración) y se filtra y pagina en el
  navegador con el estado en la URL, para poder compartir y volver atrás.
- **Checkout por línea**: cada evento del carrito se reserva y se paga por separado y muestra su propio resultado;
  un fallo no detiene ni oculta las demás líneas y lo no pagado se queda en el carrito. Así no se repite el
  defecto de la app anterior, que solo miraba el primer pago.
- **Importes en céntimos**: el total mostrado y el `totalPrice` enviado salen de la misma función, de modo que
  coinciden por construcción; se eliminó la comisión del 5 % que nunca se cobraba.
- **Un único módulo de entradas**: un solo generador de PDF y QR para checkout y «Mis reservas», cargado bajo
  demanda para que la portada no descargue `pdf-lib` ni `qrcode`.
- **Simulaciones visibles**: lo que el backend no ofrece y aun así se muestra (el formulario de contacto) vive en
  `src/mocks/`, se marca con una insignia `Demo` y no promete nada; no se finge ninguna capacidad del servidor.
- **Guards como experiencia de usuario**: `/checkout`, `/my-bookings`, `/profile` y `/admin` no montan ni
  descargan su código sin permiso, pero no son seguridad, porque el backend no autentica (ver Pendientes).
- **Tema claro y oscuro con tokens**: valores comprobados por un test golden con contraste WCAG ≥ 4.5 en ambos
  temas, para que el modo oscuro no sea una inversión improvisada.
- **Suite real separada de la simulada**: `test:e2e:real` usa otra configuración y otra carpeta, crea sus propios
  datos por la API pública y no intercepta nada; la suite simulada sigue siendo determinista y es la de CI.

## Pendientes

Huecos del backend abiertos (detalle y solución en el frontend en [`BACKEND_GAPS.md`](BACKEND_GAPS.md)):

- Autenticación por token y autorización en el servidor.
- Recuperación de contraseña.
- Paginación y filtros combinados en el servidor.
- QR de entrada verificable.
- Gestión de reservas fuera de los pagos.
- Formulario de contacto.
- Envío de correos.
- Comisión de servicio.
- `totalPrice` confiado al cliente.
- `POST /bookings` no comprueba el stock.
- Stock descontado y no restaurado si falla la confirmación.
- Datos que faltan en las respuestas y agregados de ventas.
- Campos opcionales que no se pueden vaciar.
- Texto de la semilla doblemente codificado (visible en categorías y nombres de la semilla, p. ej. `MÃºsica`).

Filas `no funciona` de [`VERIFICATION.md`](VERIFICATION.md): ninguna.

Otros:

- La suite real no corre en CI: necesita el stack completo de compose; en CI sigue corriendo `test:e2e` con la API
  simulada.
- En «Mis reservas», un grupo con una reserva confirmada y otra cancelada muestra la insignia `Pendiente`, tal como
  fija la especificación de la pantalla (solo es `Confirmada` si todas lo están); conviene revisar si las
  canceladas deben ignorarse en la insignia, como ya se ignoran en los totales.
- Algunas `imageUrl` de la semilla apuntan a imágenes externas que ya no existen (`404`); la app muestra su imagen
  de respaldo con el icono de la categoría.

## Pantallas

Descripción tomada recorriendo cada pantalla contra el stack real en ambos temas. En claro, el fondo es blanco con
halos lila suaves, las superficies son tarjetas blancas con sombras tintadas de morado y el acento es el morado de
marca (`#7C3AED`) en degradado hacia fucsia en los botones principales. En oscuro, el fondo es casi negro con halos
morados apagados, las superficies son grises muy oscuros con bordes sutiles en lugar de sombras y el acento pasa a
un lila claro con texto oscuro en los botones principales. La navbar es una barra flotante con efecto cristal en
ambos temas.

### `/` — Portada

- **Claro**: hero centrado con la etiqueta «Conciertos, arte, deporte y mucho más», titular con «sin colas» en
  degradado morado, buscador en cápsula blanca con botón «Buscar», atajos de categoría en píldoras con icono
  morado y secciones «Destacados» y «Próximos eventos» con tarjetas; las imágenes rotas caen a un degradado morado
  con el icono de la categoría.
- **Oscuro**: el mismo hero sobre fondo oscuro con halo morado tenue, «sin colas» en degradado lila, buscador y
  píldoras en gris oscuro con borde fino y botón «Buscar» lila; las tarjetas conservan el degradado morado de
  respaldo.

### `/events` — Eventos

- **Claro**: cabecera «Explora / Eventos», panel de filtros blanco (buscar, categoría, ciudad, desde, hasta,
  precio máximo, «Aplicar» morado), contador de resultados y página («N eventos · página 1 de M») y rejilla de tarjetas con foto, insignia
  de categoría, fecha sobre la imagen, precio y botón de carrito en cuadrado lila; aviso «Últimas N entradas» en
  ámbar.
- **Oscuro**: panel de filtros de cristal oscuro con campos grises, «Aplicar» lila y tarjetas oscuras con la misma
  foto; las insignias y el botón de carrito usan lila sobre fondo translúcido.

### `/events/:id` — Detalle del evento

- **Claro**: enlace «Volver a eventos», imagen grande (o degradado con icono y marca), insignia de categoría,
  título grande, descripción y ficha con inicio, fin, lugar (enlace a Google Maps), organizador y categoría; a la
  derecha, panel «Comprar entradas» blanco con precio, insignia de stock ámbar si quedan pocas, selector de
  cantidad, subtotal y «Añadir al carrito» en degradado.
- **Oscuro**: misma composición con la ficha y el panel en gris oscuro con borde, insignia de stock ámbar
  translúcida y botón lila con texto oscuro.

### `/cart` — Carrito

- **Claro**: cabecera «Tu compra / Tu carrito», líneas en tarjetas blancas con miniatura, fecha, lugar, precio por
  entrada, selector de cantidad, total de línea y papelera; resumen lateral con entradas, total grande, «Ir al
  pago» en degradado y la nota de que el total es exactamente lo que se cobra. Vacío: estado con «Explorar
  eventos».
- **Oscuro**: líneas y resumen en gris oscuro con borde; el contador del carrito en la navbar es una burbuja lila.

### `/checkout` — Pago

- **Claro**: indicador de tres pasos (Revisión, Pago, Confirmación) con el paso activo en círculo morado y los
  hechos con check; tarjeta de revisión con líneas y total; formulario con tres métodos en tarjetas
  seleccionables (la elegida con borde morado), campos de tarjeta, aviso «Pago simulado» y «Pagar N €». La
  confirmación muestra por línea el código de reserva, el QR y «Descargar entradas», con confeti si todo se aprobó.
- **Oscuro**: pasos y tarjetas en gris oscuro, método elegido con borde lila e icono lila relleno, campos oscuros y
  botón «Pagar» lila; las líneas rechazadas llevan borde e insignia rojos en ambos temas.

### `/login` — Iniciar sesión

- **Claro**: tarjeta partida: panel izquierdo en degradado morado con el logo, «Tus entradas para lo que de verdad
  te importa.» y tres ventajas; derecha blanca con «Hola de nuevo», email, contraseña, «Iniciar sesión» en
  degradado y enlace a crear cuenta. Los errores salen en una alerta roja sobre el formulario.
- **Oscuro**: el panel de marca conserva el degradado morado; el formulario pasa a gris oscuro con campos oscuros y
  botón lila.

### `/register` — Crear cuenta

- **Claro**: misma tarjeta partida que el login con «Crea tu cuenta»: nombre, apellidos, fecha de nacimiento,
  teléfono opcional, email, contraseña y repetición, «Crear cuenta» en degradado; errores en rojo bajo cada campo.
- **Oscuro**: panel de marca morado y formulario oscuro con botón lila.

### `/admin` — Panel de administración

- **Claro**: cabecera «Panel de administración», cuatro tarjetas de resumen (administradores, clientes, precio
  medio, ventas aprobadas) con icono en cuadrado lila, pestañas en cápsula y tablas blancas: usuarios con avatar,
  email, insignia de rol y papelera; eventos con acciones de informe, editar y borrar; ventas con filtros, totales
  aprobado (verde), rechazado (rojo) y pendiente (ámbar), insignias de estado y «Vista previa del informe».
- **Oscuro**: tarjetas, pestañas y tablas en gris oscuro con bordes finos; insignias de rol y estado en tonos
  translúcidos y la pestaña activa resaltada en gris más claro.

### `/contact` — Contacto

- **Claro**: cabecera «¿Hablamos?», tres tarjetas de ayuda a la izquierda y a la derecha la caja del formulario con
  la insignia `Demo` ámbar y el aviso de que los mensajes no se envían, campos y «Enviar mensaje» en degradado; al
  enviar, «¡Mensaje recibido!».
- **Oscuro**: tarjetas y formulario en gris oscuro; el aviso `Demo` es una franja ámbar translúcida con borde
  ámbar.

### `/my-bookings` — Mis reservas

- **Claro**: cabecera «Tu cuenta / Mis reservas» y una tarjeta por evento con una placa de fecha morada, título,
  insignia del grupo, fecha, lugar, total de entradas e importe (sin contar canceladas), «Descargar entradas de …»
  y la lista de reservas con su insignia (`Confirmada` verde, `Pendiente` ámbar, `Cancelada` roja), «Detalle» y
  «Cancelar». El detalle se abre en un panel lateral con el código y el QR.
- **Oscuro**: tarjetas y lista en gris oscuro, placa de fecha lila, insignias translúcidas en los mismos tonos.

### `/profile` — Mi perfil

- **Claro**: tarjeta lateral con avatar en degradado, nombre, email, tipo de cuenta y fecha de alta; formulario
  blanco con los datos personales, sección «Cambiar contraseña» y «Guardar cambios» en degradado.
- **Oscuro**: ambas tarjetas en gris oscuro, avatar lila y botón lila.

### Página no encontrada

- **Claro**: tarjeta centrada con icono de brújula en cuadrado lila, «Página no encontrada», explicación y «Volver
  al inicio» en degradado; también la ve un cliente que intenta entrar en `/admin`.
- **Oscuro**: tarjeta gris oscura con borde, icono lila y botón lila.

### Sin conexión

- **Claro**: con el navegador sin red, la página se sustituye por una tarjeta centrada con icono de wifi tachado,
  «Sin conexión», explicación y «Reintentar» en degradado; vuelve sola al recuperar la conexión.
- **Oscuro**: la misma tarjeta en gris oscuro con icono y botón lila.

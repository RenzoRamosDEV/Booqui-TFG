import { readFileSync } from 'node:fs'
import {
  expect,
  test,
  type Download,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
} from '@playwright/test'
import {
  ADMIN,
  bookingsOf,
  createCustomer,
  createEvent,
  deleteEvent,
  findEventByTitle,
  getBooking,
  getEvent,
  paymentOfBooking,
  purchaseViaApi,
  runId,
  statusOf,
  type Customer,
  type RealEvent,
} from './support/backend'
import { buyTickets, logInAs, payWithCard, submitLogin } from './support/flows'

const PARITY_DOC = new URL('../docs/FEATURE_PARITY.md', import.meta.url)
const TABLES = ['Rutas', 'Flujos transversales'] as const
type Table = (typeof TABLES)[number]
const SEPARATOR = ' — '
const APPROVED_CARD = '4242 4242 4242 4242'
const REJECTED_CARD = '4111 1111 1111 1111'

type Fixtures = PlaywrightTestArgs & PlaywrightTestOptions
const registered: string[] = []

function parityRows(table: Table): string[] {
  const markdown = readFileSync(PARITY_DOC, 'utf8')
  const section = markdown.split(`\n## ${table}\n`)[1]!.split('\n## ')[0]!
  return section
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .slice(2)
    .map((line) => line.split('|')[1]!.trim().replaceAll('`', ''))
}

function check(row: string, assertion: string, body: (fixtures: Fixtures) => Promise<void>) {
  const title = `${row}${SEPARATOR}${assertion}`
  registered.push(title)
  test(title, body)
}

let customer: Customer
let event: RealEvent

test.beforeAll(async ({ request }) => {
  customer = await createCustomer(request)
  event = await createEvent(request)
  await purchaseViaApi(request, customer, event, 2, APPROVED_CARD)
  await purchaseViaApi(request, customer, event, 1, REJECTED_CARD)
})

const asCustomer = (page: Page) => logInAs(page, customer.contactEmail, customer.password)
const asAdmin = (page: Page) => logInAs(page, ADMIN.contactEmail, ADMIN.password)
const banner = (page: Page) => page.getByRole('banner')
const cartLink = (page: Page) => banner(page).getByRole('link', { name: /^Carrito/ })

async function addToCart(page: Page, target: RealEvent, quantity = 1) {
  await page.goto(`/events/${target.id}`)
  await expect(page.getByRole('heading', { level: 1, name: target.title })).toBeVisible()
  for (let index = 1; index < quantity; index += 1) {
    await page.getByRole('button', { name: 'Añadir una entrada' }).click()
  }
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
}

async function addFromListing(page: Page, targets: RealEvent[]) {
  await page.goto('/events')
  for (const target of targets) {
    await page.getByLabel('Buscar').fill(target.title)
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await page.getByRole('button', { name: `Añadir ${target.title} al carrito` }).click()
  }
}

async function pdfOf(download: Download): Promise<Buffer> {
  const path = await download.path()
  return readFileSync(path!)
}

async function openAdminTab(page: Page, tab: 'Usuarios' | 'Eventos' | 'Ventas') {
  await asAdmin(page)
  await expect(page).toHaveURL('/admin')
  await page.getByRole('tab', { name: tab }).click()
}

test('parity rows are all covered', () => {
  for (const table of TABLES) {
    for (const row of parityRows(table)) {
      const matches = registered.filter((title) => title.split(SEPARATOR)[0] === row)
      expect(matches, `checks for parity row "${row}"`).toHaveLength(1)
    }
  }
})

test.describe('Rutas', () => {
  check('/', 'lists only events that exist in the backend', async ({ page, request }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Destacados' })).toBeVisible()
    const hrefs = await page
      .getByRole('main')
      .locator('a[href^="/events/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')!))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of new Set(hrefs)) {
      expect(await statusOf(request, `/api/v1${href}`), href).toBe(200)
    }
  })

  check('/events', 'filters by text and category and asks for login to add', async ({ page }) => {
    await page.goto(`/events?q=${encodeURIComponent(event.title)}`)

    await expect(page.getByText('1 evento', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: event.title })).toBeVisible()
    await page.getByLabel('Categoría').selectOption('Música')
    await expect(page).toHaveURL(/category=M%C3%BAsica/)
    await expect(page.getByRole('link', { name: event.title })).toBeVisible()

    await page.getByRole('button', { name: `Añadir ${event.title} al carrito` }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fevents/)
  })

  check(
    '/events/:id',
    'shows the event, its stock and caps the quantity',
    async ({ page, request }) => {
      const scarce = await createEvent(request, { availableTickets: 3 })
      await page.goto(`/events/${scarce.id}`)

      await expect(page.getByRole('heading', { level: 1, name: scarce.title })).toBeVisible()
      const panel = page.getByRole('complementary', { name: 'Comprar entradas' })
      await expect(panel).toContainText('12,50')
      await expect(panel).toContainText('Últimas 3 entradas')
      const more = page.getByRole('button', { name: 'Añadir una entrada' })
      await more.click()
      await more.click()
      await expect(more).toBeDisabled()
      await expect(page.getByRole('status', { name: 'Entradas seleccionadas' })).toHaveText('3')

      await page.goto('/events/999999999')
      await expect(page.getByRole('heading', { name: 'Evento no encontrado' })).toBeVisible()
    },
  )

  check('/cart', 'edits quantities and totals exactly price times quantity', async ({ page }) => {
    await asCustomer(page)
    await addToCart(page, event, 2)
    await cartLink(page).click()

    const line = page.getByRole('listitem', { name: event.title })
    const total = page.getByTestId('cart-total')
    await expect(total).toHaveText(/25,00/)
    await line.getByRole('button', { name: `Añadir una entrada de ${event.title}` }).click()
    await expect(total).toHaveText(/37,50/)
    await line.getByRole('button', { name: `Quitar una entrada de ${event.title}` }).click()
    await expect(total).toHaveText(/25,00/)
    await page.getByRole('button', { name: 'Ir al pago' }).click()
    await expect(page).toHaveURL('/checkout')

    await cartLink(page).click()
    await page.getByRole('button', { name: `Eliminar ${event.title} del carrito` }).click()
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  })

  check(
    '/checkout',
    'reviews, pays with PayPal and confirms the booking',
    async ({ page, request }) => {
      await asCustomer(page)
      const before = new Set((await bookingsOf(request, customer.id)).map(({ id }) => id))

      await buyTickets(page, event, 1)
      await expect(page.getByRole('list', { name: 'Pasos del pago' })).toBeVisible()
      await page.getByText('PayPal', { exact: true }).click()
      await expect(page.getByLabel('Número de tarjeta')).toHaveCount(0)
      await page.getByRole('button', { name: /^Pagar/ }).click()

      await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
      const created = (await bookingsOf(request, customer.id)).filter(({ id }) => !before.has(id))
      expect(created).toHaveLength(1)
      expect((await getBooking(request, created[0]!.id)).status).toBe('CONFIRMED')
      expect((await paymentOfBooking(request, created[0]!.id))?.paymentMethod).toBe('PAYPAL')
    },
  )

  check('/login', 'validates locally and maps 401 to the Spanish message', async ({ page }) => {
    const logins: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/users/login')) logins.push(request.url())
    })
    await page.goto('/login')

    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('El email es obligatorio')).toBeVisible()
    await expect(page.getByText('La contraseña es obligatoria')).toBeVisible()
    expect(logins).toEqual([])

    await submitLogin(page, customer.contactEmail, 'contraseña-incorrecta')
    await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos.')
  })

  check(
    '/register',
    'validates like CreateUserRequest and registers a customer',
    async ({ page, request }) => {
      const email = `e2e-register-${runId}@booqi.test`
      async function fillForm(password: string) {
        await page.getByLabel('Nombre').fill('Grace')
        await page.getByLabel('Apellidos').fill('Registro')
        await page.getByLabel('Fecha de nacimiento').fill('1990-01-15')
        await page.getByLabel('Email').fill(email)
        await page.getByLabel('Contraseña', { exact: true }).fill(password)
        await page.getByLabel('Repite la contraseña').fill(password)
        await page.getByRole('button', { name: 'Crear cuenta' }).last().click()
      }
      await page.goto('/register')

      await fillForm('1234567')
      await expect(page.getByText('La contraseña debe tener al menos 8 caracteres')).toBeVisible()
      await fillForm('12345678')
      await expect(page).toHaveURL('/login')
      const users = await (
        await request.get('/api/v1/users', { params: { contactEmail: email } })
      ).json()
      expect(users).toMatchObject([{ contactEmail: email, role: 'CUSTOMER' }])

      await page.goto('/register')
      await fillForm('12345678')
      await expect(page.getByText('Este email ya está registrado.')).toBeVisible()
    },
  )

  check('/admin', 'is reserved to admins and shows the panel', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login?redirect=%2Fadmin')

    await asCustomer(page)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()

    await banner(page).getByRole('button', { name: 'Cerrar sesión' }).click()
    await asAdmin(page)
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()
    await expect(page.getByText('Administradores')).toBeVisible()
    for (const tab of ['Usuarios', 'Eventos', 'Ventas']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible()
    }
  })

  check('/contact', 'shows the Demo badge and sends nothing to the backend', async ({ page }) => {
    const writes: string[] = []
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`)
    })
    await page.goto('/contact')

    await expect(page.getByText('Demo', { exact: true })).toBeVisible()
    await expect(page.getByText('los mensajes no se envían a ningún sitio')).toBeVisible()
    const form = page.getByRole('region', { name: 'Formulario de contacto' })
    await form.getByLabel('Nombre').fill('Ada')
    await form.getByLabel('Email').fill('ada@booqi.test')
    await form.getByLabel('Asunto').fill('Consulta de prueba')
    await form.getByLabel('Mensaje').fill('Mensaje escrito por la suite E2E contra el backend.')
    await form.getByRole('button', { name: 'Enviar mensaje' }).click()

    await expect(page.getByRole('heading', { name: '¡Mensaje recibido!' })).toBeVisible()
    expect(writes).toEqual([])
  })

  check('/my-bookings', 'asks for login and groups the bookings by event', async ({ page }) => {
    await page.goto('/my-bookings')
    await expect(page).toHaveURL('/login?redirect=%2Fmy-bookings')

    await submitLogin(page, customer.contactEmail, customer.password)
    await expect(page).toHaveURL('/my-bookings')
    const group = page.getByRole('article', { name: event.title })
    await expect(group).toHaveCount(1)
    await expect(group.getByRole('listitem', { name: /^Reserva / }).first()).toBeVisible()
    await expect(group.getByText('Cancelada').first()).toBeVisible()
    await expect(
      group.getByRole('button', { name: `Descargar entradas de ${event.title}` }),
    ).toBeEnabled()
  })
})

test.describe('Flujos transversales', () => {
  check(
    'Sesión de autenticación',
    'survives a reload and is cleared on logout',
    async ({ page }) => {
      await asCustomer(page)
      await page.reload()
      await expect(banner(page).getByText(customer.firstName)).toBeVisible()

      await banner(page).getByRole('button', { name: 'Cerrar sesión' }).click()
      await expect(banner(page).getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
      await page.reload()
      await expect(banner(page).getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
    },
  )

  check('Navegación por rol', 'shows the links each role can use', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await page.goto('/')
    await expect(banner(page).getByRole('link', { name: 'Crear cuenta' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Mis reservas' })).toHaveCount(0)

    await asCustomer(page)
    await expect(nav.getByRole('link', { name: 'Mis reservas' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Perfil' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Administración' })).toHaveCount(0)
    await expect(cartLink(page)).toBeVisible()

    await banner(page).getByRole('button', { name: 'Cerrar sesión' }).click()
    await asAdmin(page)
    await expect(nav.getByRole('link', { name: 'Administración' })).toBeVisible()
  })

  check('Carrito', 'merges repeated additions and is lost on reload', async ({ page }) => {
    await asCustomer(page)
    await addToCart(page, event)
    await page.getByRole('button', { name: 'Añadir al carrito' }).click()
    await expect(cartLink(page)).toHaveAccessibleName('Carrito, 2 entradas')
    await cartLink(page).click()
    await expect(page.getByRole('listitem', { name: event.title })).toHaveCount(1)

    await page.reload()
    await expect(cartLink(page)).toHaveAccessibleName('Carrito, 0 entradas')
  })

  check(
    'Checkout: reserva + pago',
    'pays each line on its own and keeps failures',
    async ({ page, request }) => {
      const kept = await createEvent(request)
      const vanishing = await createEvent(request)
      await asCustomer(page)
      await addFromListing(page, [kept, vanishing])
      await cartLink(page).click()
      await page.getByRole('button', { name: 'Ir al pago' }).click()
      await page.getByRole('button', { name: 'Continuar al pago' }).click()
      await deleteEvent(request, vanishing.id)

      await payWithCard(page, APPROVED_CARD)

      await expect(page.getByRole('heading', { name: 'Resultado del pago' })).toBeVisible()
      await expect(page.getByRole('listitem', { name: kept.title })).toContainText('Pagado')
      await expect(page.getByRole('listitem', { name: vanishing.title })).toContainText(
        'No se pudo completar',
      )
      await expect(cartLink(page)).toHaveAccessibleName('Carrito, 1 entrada')
    },
  )

  check(
    'Comisión de servicio',
    'charges exactly the shown total, without fee',
    async ({ page, request }) => {
      await asCustomer(page)
      const before = new Set((await bookingsOf(request, customer.id)).map(({ id }) => id))
      await addToCart(page, event, 2)
      await cartLink(page).click()
      await expect(page.getByTestId('cart-total')).toHaveText(/25,00/)
      await expect(page.getByRole('main')).not.toContainText(/comisi[oó]n/i)

      await page.getByRole('button', { name: 'Ir al pago' }).click()
      await page.getByRole('button', { name: 'Continuar al pago' }).click()
      await payWithCard(page, APPROVED_CARD)
      await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()

      const created = (await bookingsOf(request, customer.id)).filter(({ id }) => !before.has(id))
      expect(created[0]!.totalPrice).toBe(25)
      expect((await paymentOfBooking(request, created[0]!.id))?.totalPrice).toBe(25)
    },
  )

  check('Confirmación por correo', 'nothing promises an email', async ({ page }) => {
    const emailPromise = /(recibir|enviar|enviaremos|recibirás)[^.]*\b(correo|e-?mail)\b/i
    await asCustomer(page)
    await buyTickets(page, event, 1)
    await payWithCard(page, APPROVED_CARD)
    await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText(emailPromise)

    await page.goto('/contact')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText(emailPromise)
  })

  check('PDF de entradas', 'downloads tickets from checkout and my bookings', async ({ page }) => {
    await asCustomer(page)
    await buyTickets(page, event, 1)
    await payWithCard(page, APPROVED_CARD)
    const fromCheckout = page.waitForEvent('download')
    await page
      .getByRole('listitem', { name: event.title })
      .getByRole('button', { name: 'Descargar entradas' })
      .click()
    const checkoutPdf = await fromCheckout
    expect(checkoutPdf.suggestedFilename()).toMatch(/^booqi-.+\.pdf$/)
    expect((await pdfOf(checkoutPdf)).subarray(0, 5).toString()).toBe('%PDF-')

    await page.goto('/my-bookings')
    const fromBookings = page.waitForEvent('download')
    await page.getByRole('button', { name: `Descargar entradas de ${event.title}` }).click()
    expect((await pdfOf(await fromBookings)).subarray(0, 5).toString()).toBe('%PDF-')
  })

  check(
    'Previsualización de PDF',
    'previews the report, downloads it and closes',
    async ({ page }) => {
      await openAdminTab(page, 'Ventas')
      await page.getByLabel('Evento').selectOption({ label: event.title })
      await page.getByRole('button', { name: 'Vista previa del informe' }).click()

      const dialog = page.getByRole('dialog', { name: 'Vista previa del informe' })
      await expect(dialog.locator('iframe')).toHaveAttribute('src', /^blob:/)
      const download = page.waitForEvent('download')
      await dialog.getByRole('button', { name: 'Descargar' }).click()
      expect((await download).suggestedFilename()).toMatch(/^booqi-informe-.+\.pdf$/)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    },
  )

  check(
    'Panel de ventas (admin)',
    'joins payments and bookings with filters and totals',
    async ({ page }) => {
      await openAdminTab(page, 'Ventas')
      await page.getByLabel('Evento').selectOption({ label: event.title })

      const table = page.getByRole('table', { name: 'Ventas' })
      await expect(
        table.getByRole('row').filter({ hasText: customer.lastName }).first(),
      ).toBeVisible()
      await expect(page.getByTestId('total-rejected')).toHaveText(/12,50/)
      await page.getByLabel('Estado del pago').selectOption('REJECTED')
      await expect(page.getByTestId('total-approved')).toHaveText(/0,00/)
      await expect(table.getByRole('row').filter({ hasText: 'Rechazado' }).first()).toBeVisible()
    },
  )

  check(
    'Exportación de informe de evento (admin)',
    'exports the event sales report',
    async ({ page }) => {
      await openAdminTab(page, 'Eventos')
      await page.getByRole('button', { name: `Informe de ventas de ${event.title}` }).click()

      const dialog = page.getByRole('dialog', { name: 'Vista previa del informe' })
      await expect(dialog).toContainText(`Informe de ventas · ${event.title}`)
      const download = page.waitForEvent('download')
      await dialog.getByRole('button', { name: 'Descargar' }).click()
      expect((await pdfOf(await download)).subarray(0, 5).toString()).toBe('%PDF-')
    },
  )

  check(
    'Gestión de usuarios (admin)',
    'deletes a user after confirming in a dialog',
    async ({ page, request }) => {
      const doomed = await createCustomer(request)
      await openAdminTab(page, 'Usuarios')

      await expect(page.getByRole('button', { name: 'Eliminar a Mel Admin' })).toHaveCount(0)
      await page
        .getByRole('button', { name: `Eliminar a ${doomed.firstName} ${doomed.lastName}` })
        .click()
      await page
        .getByRole('dialog', { name: '¿Eliminar usuario?' })
        .getByRole('button', { name: 'Eliminar' })
        .click()

      await expect(page.getByRole('status').getByText('Usuario eliminado')).toBeVisible()
      expect(await statusOf(request, `/api/v1/users/${doomed.id}`)).toBe(404)
    },
  )

  check(
    'Gestión de eventos (admin)',
    'creates, edits and deletes an event',
    async ({ page, request }) => {
      const title = `E2E ${runId} Admin`
      await openAdminTab(page, 'Eventos')

      await page.getByRole('button', { name: 'Nuevo evento' }).click()
      const form = page.getByRole('dialog', { name: 'Nuevo evento' })
      await form.getByLabel('Título').fill(title)
      await form.getByLabel('Entradas disponibles').fill('20')
      await form.getByLabel('Precio (€)').fill('9.5')
      await form.getByLabel('Inicio').fill(`${new Date().getFullYear() + 1}-06-01T20:00`)
      await form.getByLabel('Fin').fill(`${new Date().getFullYear() + 1}-06-01T22:00`)
      await form.getByLabel('Ubicación').fill('Sevilla')
      await form.getByLabel('Organizador').fill('Booqi E2E')
      await form.getByLabel('Categoría').selectOption('Música')
      await form.getByLabel('Email de contacto').fill(`e2e-admin-${runId}@booqi.test`)
      await form.getByLabel('Teléfono de contacto').fill('600000001')
      await form.getByRole('button', { name: 'Crear evento' }).click()
      await expect(page.getByRole('status').getByText('Evento creado')).toBeVisible()
      const created = await findEventByTitle(request, title)
      expect(created).toMatchObject({ location: 'Sevilla', availableTickets: 20 })

      await page.getByRole('button', { name: `Editar ${title}` }).click()
      const edit = page.getByRole('dialog', { name: 'Editar evento' })
      await edit.getByLabel('Ubicación').fill('Valencia')
      await edit.getByRole('button', { name: 'Guardar cambios' }).click()
      await expect(page.getByRole('status').getByText('Evento actualizado')).toBeVisible()
      expect((await getEvent(request, created!.id)).location).toBe('Valencia')

      await page.getByRole('button', { name: `Eliminar ${title}` }).click()
      await page
        .getByRole('dialog', { name: '¿Eliminar evento?' })
        .getByRole('button', { name: 'Eliminar' })
        .click()
      await expect(page.getByRole('status').getByText('Evento eliminado')).toBeVisible()
      expect(await statusOf(request, `/api/v1/events/${created!.id}`)).toBe(404)
    },
  )

  check('Mensajes de error de la API', 'shows the ProblemDetail detail', async ({ page }) => {
    await openAdminTab(page, 'Eventos')
    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    const form = page.getByRole('dialog', { name: 'Nuevo evento' })
    await form.getByLabel('Título').fill(`E2E ${runId} Duplicado`)
    await form.getByLabel('Entradas disponibles').fill('5')
    await form.getByLabel('Precio (€)').fill('5')
    await form.getByLabel('Inicio').fill(`${new Date().getFullYear() + 1}-07-01T20:00`)
    await form.getByLabel('Fin').fill(`${new Date().getFullYear() + 1}-07-01T22:00`)
    await form.getByLabel('Ubicación').fill('Bilbao')
    await form.getByLabel('Organizador').fill('Booqi E2E')
    await form.getByLabel('Categoría').selectOption('Música')
    await form.getByLabel('Email de contacto').fill(event.contactEmail)
    await form.getByLabel('Teléfono de contacto').fill('600000002')
    await form.getByRole('button', { name: 'Crear evento' }).click()

    await expect(form).toContainText(`Event with contactEmail ${event.contactEmail} already exists`)
    await expect(form).toBeVisible()
  })

  check(
    'Autorización en servidor',
    'guards /admin in the browser only',
    async ({ page, request }) => {
      const adminChunks: string[] = []
      page.on('request', (sent) => {
        if (/AdminPage[-.]/.test(sent.url())) adminChunks.push(sent.url())
      })
      await asCustomer(page)
      await page.goto('/admin')

      await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
      expect(adminChunks).toEqual([])
      expect(await statusOf(request, '/api/v1/users')).toBe(200)
    },
  )
})

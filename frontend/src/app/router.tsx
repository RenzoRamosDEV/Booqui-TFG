import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireAuth } from './guards'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaceholderPage, type PlaceholderPageProps } from './pages/PlaceholderPage'

function placeholder(path: string, props: PlaceholderPageProps): RouteObject {
  return { path, element: <PlaceholderPage {...props} /> }
}

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      placeholder('/', {
        title: 'Inicio',
        heading: 'Tus eventos favoritos,',
        description:
          'Descubre conciertos, exposiciones y experiencias, y reserva tus entradas en segundos.',
        backdrop: true,
      }),
      placeholder('/events', {
        title: 'Eventos',
        description: 'Explora todos los eventos disponibles y encuentra tu próximo plan.',
      }),
      placeholder('/events/:id', {
        title: 'Detalle del evento',
        description: 'Fecha, lugar, precio y entradas disponibles del evento.',
      }),
      placeholder('/cart', {
        title: 'Carrito',
        description: 'Revisa las entradas que has añadido antes de pagar.',
      }),
      placeholder('/login', {
        title: 'Iniciar sesión',
        description: 'Accede a tu cuenta de Booqi para reservar y consultar tus entradas.',
      }),
      placeholder('/register', {
        title: 'Crear cuenta',
        description: 'Regístrate en Booqi para reservar entradas en tus eventos favoritos.',
      }),
      placeholder('/contact', {
        title: 'Contacto',
        description: '¿Tienes dudas? Escríbenos y te responderemos lo antes posible.',
      }),
      {
        element: <RequireAuth requirement="auth" />,
        children: [
          placeholder('/checkout', {
            title: 'Pago',
            description: 'Confirma tus entradas y completa el pago de forma segura.',
          }),
          placeholder('/my-bookings', {
            title: 'Mis reservas',
            description: 'Consulta tus reservas y descarga tus entradas.',
          }),
          placeholder('/profile', {
            title: 'Mi perfil',
            description: 'Consulta y actualiza los datos de tu cuenta.',
          }),
        ],
      },
      {
        element: <RequireAuth requirement="admin" />,
        children: [
          placeholder('/admin', {
            title: 'Administración',
            description: 'Gestiona usuarios, eventos y ventas de Booqi.',
          }),
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}

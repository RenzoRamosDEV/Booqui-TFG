import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireAuth } from './guards'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import type { PlaceholderPageProps } from './pages/PlaceholderPage'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { RouteSkeleton } from './pages/RouteSkeleton'

function placeholder(path: string, props: PlaceholderPageProps): RouteObject {
  return {
    path,
    lazy: async () => {
      const { PlaceholderPage } = await import('./pages/PlaceholderPage')
      return { Component: () => <PlaceholderPage {...props} /> }
    },
  }
}

export const routes: RouteObject[] = [
  {
    id: 'root',
    element: <AppLayout />,
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: () => (
      <AppLayout>
        <RouteSkeleton />
      </AppLayout>
    ),
    children: [
      {
        id: 'pages',
        ErrorBoundary: RouteErrorPage,
        children: [
          {
            path: '/',
            lazy: () =>
              import('../features/events/pages/HomePage').then((m) => ({ Component: m.HomePage })),
          },
          {
            path: '/events',
            lazy: () =>
              import('../features/events/pages/EventsPage').then((m) => ({
                Component: m.EventsPage,
              })),
          },
          {
            path: '/events/:id',
            lazy: () =>
              import('../features/events/pages/EventDetailPage').then((m) => ({
                Component: m.EventDetailPage,
              })),
          },
          placeholder('/cart', {
            title: 'Carrito',
            description: 'Revisa las entradas que has añadido antes de pagar.',
          }),
          {
            path: '/login',
            lazy: () =>
              import('../features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
          },
          {
            path: '/register',
            lazy: () =>
              import('../features/auth/pages/RegisterPage').then((m) => ({
                Component: m.RegisterPage,
              })),
          },
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
              {
                path: '/profile',
                lazy: () =>
                  import('../features/auth/pages/ProfilePage').then((m) => ({
                    Component: m.ProfilePage,
                  })),
              },
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
          // Already in the entry chunk through the guards, so there is nothing to split.
          { path: '*', lazy: async () => ({ Component: NotFoundPage }) },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}

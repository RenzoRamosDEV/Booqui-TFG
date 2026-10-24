import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireAuth } from './guards'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { RouteSkeleton } from './pages/RouteSkeleton'

/**
 * React Router resolves the `lazy` of every matched route before the guard element renders, so a
 * protected page loaded that way would be downloaded even for users the guard turns away. This
 * resolves to a tiny wrapper instead; the page's own chunk is fetched only when the guard renders it.
 */
function loadWhenRendered(load: () => Promise<ComponentType>): RouteObject['lazy'] {
  const Page = lazy(async () => ({ default: await load() }))
  function GuardedPage() {
    return (
      <Suspense fallback={<RouteSkeleton />}>
        <Page />
      </Suspense>
    )
  }
  return async () => ({ Component: GuardedPage })
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
          {
            path: '/cart',
            lazy: () =>
              import('../features/cart/pages/CartPage').then((m) => ({ Component: m.CartPage })),
          },
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
          {
            path: '/contact',
            lazy: () =>
              import('../features/contact/pages/ContactPage').then((m) => ({
                Component: m.ContactPage,
              })),
          },
          {
            element: <RequireAuth requirement="auth" />,
            children: [
              {
                path: '/checkout',
                lazy: () =>
                  import('../features/checkout/pages/CheckoutPage').then((m) => ({
                    Component: m.CheckoutPage,
                  })),
              },
              {
                path: '/my-bookings',
                lazy: () =>
                  import('../features/bookings/pages/MyBookingsPage').then((m) => ({
                    Component: m.MyBookingsPage,
                  })),
              },
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
              {
                path: '/admin',
                lazy: loadWhenRendered(() =>
                  import('../features/admin/pages/AdminPage').then((m) => m.AdminPage),
                ),
              },
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

export type AppRouter = ReturnType<typeof createAppRouter>

/** Resolves once the first route's code has loaded, so the layout mounts only once. */
export function routerReady(router: AppRouter): Promise<void> {
  if (router.state.initialized) return Promise.resolve()
  return new Promise((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (!state.initialized) return
      unsubscribe()
      resolve()
    })
  })
}

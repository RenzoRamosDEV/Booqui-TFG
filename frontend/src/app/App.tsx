import { RouterProvider } from 'react-router'
import { Providers } from './providers'
import type { AppRouter } from './router'

export function App({ router }: { router: AppRouter }) {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}

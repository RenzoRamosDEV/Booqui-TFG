import { useReducer, type MouseEvent, type ReactNode } from 'react'
import { focusRing } from '../../components/ui/button-styles'
import { cn } from '../../lib/cn'
import { useOnlineStatus } from '../../lib/network'
import { OfflinePage } from '../pages/OfflinePage'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { PageTransition } from './PageTransition'

function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  document.getElementById('main')?.focus()
}

/** `children` replaces the routed outlet, e.g. with a skeleton while the first route loads. */
export function AppLayout({ children }: { children?: ReactNode }) {
  const online = useOnlineStatus()
  // Re-rendering re-reads navigator.onLine, which is all a manual retry can do while offline.
  const [, retry] = useReducer((count: number) => count + 1, 0)
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        onClick={focusMain}
        className={cn(
          'sr-only z-50 rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3',
          focusRing,
        )}
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 outline-none"
      >
        {online ? (children ?? <PageTransition />) : <OfflinePage onRetry={retry} />}
      </main>
      <Footer />
    </div>
  )
}

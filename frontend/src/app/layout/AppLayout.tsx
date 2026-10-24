import type { MouseEvent } from 'react'
import { focusRing } from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { PageTransition } from './PageTransition'

function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  document.getElementById('main')?.focus()
}

export function AppLayout() {
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
        <PageTransition />
      </main>
      <Footer />
    </div>
  )
}

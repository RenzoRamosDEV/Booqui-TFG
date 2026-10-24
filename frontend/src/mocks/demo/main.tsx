// MOCK: punto de entrada de la demo de GitHub Pages, que no tiene backend; `vite build --mode demo` lo
// usa en lugar de src/main.tsx, así que nada de la demo entra en el build de producción.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from 'react-router'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import { App } from '../../app/App'
import { routerReady, routes } from '../../app/router'
import '../../styles/globals.css'
import { DemoBadge } from './DemoBadge'
import { DemoLoginPage } from './DemoLoginPage'
import { withDemoLogin } from './demo-routes'
import { installDemo } from './install'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

installDemo({ storage: sessionStorage, now: new Date() })
// GitHub Pages has no SPA fallback, so the demo keeps its routes in the hash.
const router = createHashRouter(withDemoLogin(routes, DemoLoginPage))
void routerReady(router).then(() => {
  createRoot(root).render(
    <StrictMode>
      <App router={router} />
      <DemoBadge />
    </StrictMode>,
  )
})

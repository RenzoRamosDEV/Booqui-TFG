import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import { App } from './app/App'
import { createAppRouter, routerReady } from './app/router'
import './styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const router = createAppRouter()
void routerReady(router).then(() => {
  createRoot(root).render(
    <StrictMode>
      <App router={router} />
    </StrictMode>,
  )
})

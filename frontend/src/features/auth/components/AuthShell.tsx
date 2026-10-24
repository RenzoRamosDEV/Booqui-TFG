import { CalendarCheck, QrCode, Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import logo from '../../../assets/logo_booqi_nuevo.png'

const highlights = [
  { icon: Ticket, text: 'Reserva tus entradas en unos segundos' },
  { icon: QrCode, text: 'Lleva tus entradas con código QR en el móvil' },
  { icon: CalendarCheck, text: 'Consulta y gestiona tus reservas cuando quieras' },
]

export type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-lg lg:grid-cols-[1fr_1.1fr]">
      <div className="relative isolate hidden flex-col justify-between gap-10 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 p-10 text-white lg:flex">
        <div className="event-fallback-pattern absolute inset-0 -z-10 opacity-30" />
        <div className="brand-blob absolute -top-16 -right-10 -z-10 size-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="brand-blob brand-blob--slow absolute -bottom-20 -left-10 -z-10 size-72 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-md bg-white shadow-sm">
            <img src={logo} alt="" className="size-8 object-contain" />
          </span>
          <span className="font-display text-xl font-bold">Booqi</span>
        </div>
        <div className="flex flex-col gap-6">
          <p className="font-display text-3xl leading-tight font-bold">
            Tus entradas para lo que de verdad te importa.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-white/90">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-white/15 ring-1 ring-white/20">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg">{title}</h1>
          <p className="text-fg-muted">{description}</p>
        </div>
        {children}
        {footer && (
          <div className="border-t border-border pt-5 text-sm text-fg-muted">{footer}</div>
        )}
      </div>
    </div>
  )
}

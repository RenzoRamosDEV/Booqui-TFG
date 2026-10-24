export function DemoBadge() {
  return (
    <div
      role="note"
      aria-describedby="demo-badge-help"
      // Inline position: utilities used only here would end up in the production CSS too.
      style={{ left: '1rem', zIndex: 55 }}
      className="pointer-events-none fixed bottom-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-fg shadow-md"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-brand-600" />
      <span>Demo · datos simulados</span>
      <span id="demo-badge-help" className="sr-only">
        No hay servidor: todo lo que hagas se guarda solo en este navegador.
      </span>
    </div>
  )
}

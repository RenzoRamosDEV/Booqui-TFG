export function BrandBackdrop() {
  return (
    <div
      data-testid="brand-backdrop"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] overflow-hidden"
    >
      <div className="brand-pattern absolute inset-0" />
      <div className="brand-blob absolute -top-10 left-[8%] size-72 rounded-full bg-[var(--blob-a)] blur-3xl sm:size-96" />
      <div className="brand-blob brand-blob--slow absolute top-24 right-[6%] size-64 rounded-full bg-[var(--blob-b)] blur-3xl sm:size-80" />
    </div>
  )
}

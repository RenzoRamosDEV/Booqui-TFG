import { Skeleton } from '../../components/ui/Skeleton'

export function RouteSkeleton() {
  return (
    <section aria-busy="true" aria-label="Cargando página" className="flex flex-col gap-6">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56" />
        ))}
      </div>
    </section>
  )
}

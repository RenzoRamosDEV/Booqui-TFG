import { Sparkles } from 'lucide-react'
import { BrandBackdrop } from '../../components/BrandBackdrop'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageMeta } from '../PageMeta'

export type PlaceholderPageProps = {
  title: string
  description: string
  heading?: string
  backdrop?: boolean
}

export function PlaceholderPage({
  title,
  description,
  heading = title,
  backdrop = false,
}: PlaceholderPageProps) {
  return (
    <section className="relative isolate flex flex-col gap-10">
      <PageMeta title={title} description={description} />
      {backdrop && <BrandBackdrop />}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
          Booqi
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          {backdrop ? (
            <>
              {heading} <span className="text-gradient-brand">sin colas</span>
            </>
          ) : (
            heading
          )}
        </h1>
        <p className="max-w-2xl text-lg text-fg-muted">{description}</p>
      </div>
      <EmptyState
        icon={Sparkles}
        title="Próximamente"
        description="Estamos rediseñando esta pantalla. Muy pronto estará disponible."
      />
    </section>
  )
}

import { Euro, ShieldCheck, Tag, Users, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { listStagger } from '../../../lib/motion'
import { formatEuro } from '../../../lib/money'
import type { AdminSummary } from '../hooks/admin-summary'

type Card = { id: string; label: string; value: string; icon: LucideIcon }

export function SummaryCards({ summary }: { summary: AdminSummary }) {
  const reduced = useReducedMotion() ?? false
  const { container, item } = listStagger(reduced)
  const cards: Card[] = [
    { id: 'admins', label: 'Administradores', value: String(summary.admins), icon: ShieldCheck },
    { id: 'customers', label: 'Clientes', value: String(summary.customers), icon: Users },
    {
      id: 'average',
      label: 'Precio medio',
      value: formatEuro(summary.averagePriceCents),
      icon: Tag,
    },
    {
      id: 'approved',
      label: 'Ventas aprobadas',
      value: formatEuro(summary.approvedCents),
      icon: Euro,
    },
  ]
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {cards.map(({ id, label, value, icon: Icon }) => (
        <motion.li
          key={id}
          variants={item}
          className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-md dark:shadow-sm"
        >
          <div className="absolute -top-8 -right-8 size-24 rounded-full bg-brand-400/10 blur-xl" />
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-sm text-fg-muted">{label}</span>
          </div>
          <p data-testid={`summary-${id}`} className="mt-3 font-display text-2xl font-bold text-fg">
            {value}
          </p>
        </motion.li>
      ))}
    </motion.ul>
  )
}

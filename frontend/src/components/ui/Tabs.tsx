import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { focusRing } from './button-styles'

export type TabItem = { id: string; label: string; content: ReactNode }

export type TabsProps = {
  label: string
  items: TabItem[]
  defaultValue?: string
  onChange?: (id: string) => void
  className?: string
}

export function Tabs({ label, items, defaultValue, onChange, className }: TabsProps) {
  const baseId = useId()
  const [selected, setSelected] = useState(defaultValue ?? items[0]?.id)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  function select(id: string) {
    setSelected(id)
    onChange?.(id)
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = items.length - 1
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const target = items[targets[event.key] ?? -1]
    if (!target) return
    event.preventDefault()
    select(target.id)
    tabRefs.current.get(target.id)?.focus()
  }

  const active = items.find((item) => item.id === selected)
  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex gap-1 rounded-lg border border-border bg-bg-elevated p-1"
      >
        {items.map((item, index) => {
          const isSelected = item.id === selected
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node)
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150',
                focusRing,
                isSelected ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {active && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className={cn('mt-4 rounded-md', focusRing)}
        >
          {active.content}
        </div>
      )}
    </div>
  )
}

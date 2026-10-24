import { LogIn } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { DEMO_ACCOUNTS, type DemoAccount } from './seed'

export type DemoLoginButtonsProps = {
  onPick: (account: DemoAccount) => void
  disabled?: boolean
}

export function DemoLoginButtons({ onPick, disabled = false }: DemoLoginButtonsProps) {
  return (
    <section
      aria-label="Cuentas de demostración"
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4"
    >
      <p className="text-sm text-fg-muted">
        Esta demo no tiene servidor. Entra con una de las cuentas de ejemplo:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <div key={account.email} className="flex flex-col gap-1">
            <Button variant="secondary" disabled={disabled} onClick={() => onPick(account)}>
              <LogIn aria-hidden="true" className="size-4" />
              Entrar como {account.label} demo
            </Button>
            <p className="text-center text-xs break-all text-fg-muted">
              {account.email} · {account.password}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

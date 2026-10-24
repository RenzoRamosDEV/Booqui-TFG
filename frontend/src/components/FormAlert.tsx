import { CircleAlert } from 'lucide-react'

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm font-medium text-danger"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

import { CircleHelp, MailCheck, MessageSquareText, Send, Ticket } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { zodResolver } from '../../../lib/zod-resolver'
import { sendContactMessage } from '../../../mocks/contact'
import { contactSchema } from '../api/contact-schema'

const emptyForm = { name: '', email: '', subject: '', message: '' }

const topics = [
  {
    icon: Ticket,
    title: 'Entradas y reservas',
    text: 'Consulta, descarga o cancela tus reservas desde «Mis reservas».',
  },
  {
    icon: CircleHelp,
    title: 'Dudas sobre un evento',
    text: 'Cada evento muestra organizador, horario y ubicación.',
  },
  { icon: MessageSquareText, title: 'Sugerencias', text: 'Cuéntanos qué mejorarías de Booqi.' },
]

function DemoNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
      <Badge tone="warning">Demo</Badge>
      <p className="text-sm text-fg">
        Este formulario es una demostración: los mensajes no se envían a ningún sitio.
      </p>
    </div>
  )
}

function ContactForm({ onSent }: { onSent: (name: string) => void }) {
  const form = useForm({ resolver: zodResolver(contactSchema), defaultValues: emptyForm })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const { receivedBy } = await sendContactMessage(values)
    onSent(receivedBy)
  })

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          autoComplete="name"
          error={errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
      </div>
      <Input label="Asunto" error={errors.subject?.message} {...form.register('subject')} />
      <Textarea
        label="Mensaje"
        rows={6}
        error={errors.message?.message}
        {...form.register('message')}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          <Send aria-hidden="true" className="size-4" />
          Enviar mensaje
        </Button>
      </div>
    </form>
  )
}

export function ContactPage() {
  const [sentBy, setSentBy] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-8">
      <PageMeta
        title="Contacto"
        description="¿Tienes dudas sobre Booqi? Escríbenos desde el formulario de contacto."
      />
      <PageHeader
        eyebrow="Contacto"
        title="¿Hablamos?"
        description="Escríbenos con cualquier duda o sugerencia sobre Booqi."
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:self-start">
          {topics.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-fg">{title}</p>
                <p className="text-sm text-fg-muted">{text}</p>
              </div>
            </div>
          ))}
        </aside>
        <section
          aria-label="Formulario de contacto"
          className="flex flex-col gap-5 rounded-xl border border-glass-border bg-glass p-6 shadow-lg backdrop-blur-xl sm:p-8"
        >
          <DemoNotice />
          {sentBy === null ? (
            <ContactForm onSent={setSentBy} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <span className="grid size-16 place-items-center rounded-full bg-success/15 text-success">
                <MailCheck aria-hidden="true" className="size-8" />
              </span>
              <h2 className="font-display text-2xl font-bold text-fg">¡Mensaje recibido!</h2>
              <p className="max-w-md text-fg-muted">
                Gracias, {sentBy}. Como esto es una demostración, tu mensaje no se ha enviado a
                nadie.
              </p>
              <Button variant="secondary" onClick={() => setSentBy(null)}>
                Escribir otro mensaje
              </Button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}

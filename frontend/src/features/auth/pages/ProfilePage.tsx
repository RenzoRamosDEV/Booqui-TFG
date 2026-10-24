import { Save, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PageMeta } from '../../../app/PageMeta'
import { FormAlert } from '../../../components/FormAlert'
import { PageHeader } from '../../../components/PageHeader'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../components/ui/use-toast'
import { formatDate } from '../../../lib/dates'
import { changedFields } from '../../../lib/diff'
import { applyServerErrors } from '../../../lib/form-errors'
import { zodResolver } from '../../../lib/zod-resolver'
import type { UserResponse } from '../../../types/user'
import { profileSchema, type ProfileValues } from '../api/form-schemas'
import { PersonFields } from '../components/PersonFields'
import { useSessionStore } from '../hooks/session-store'
import { useUpdateProfile } from '../hooks/use-auth-mutations'

const FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'contactPhone',
  'contactEmail',
  'password',
] as const

const roleLabels = { ADMIN: 'Administrador', CUSTOMER: 'Cliente' } as const

function formValues(user: UserResponse): ProfileValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    contactPhone: user.contactPhone ?? '',
    contactEmail: user.contactEmail,
    password: '',
    confirmPassword: '',
  }
}

function ProfileForm({ user }: { user: UserResponse }) {
  const toast = useToast()
  const update = useUpdateProfile(user.id)
  const form = useForm({ resolver: zodResolver(profileSchema()), defaultValues: formValues(user) })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const { firstName, lastName, dateOfBirth, contactPhone, contactEmail, password } = values
    const patch = changedFields(user, {
      firstName,
      lastName,
      dateOfBirth,
      contactPhone,
      contactEmail,
      password,
    })
    if (Object.keys(patch).length === 0) {
      toast.show({ title: 'No hay cambios que guardar' })
      return
    }
    try {
      const updated = await update.mutateAsync(patch)
      form.reset(formValues(updated))
      toast.show({ tone: 'success', title: 'Perfil actualizado' })
    } catch (error) {
      applyServerErrors(error, form.setError, {
        fields: FIELDS,
        statusFields: { 409: { field: 'contactEmail', message: 'Este email ya está registrado.' } },
      })
    }
  })

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <FormAlert message={errors.root?.server?.message} />
      <PersonFields register={form.register} errors={errors} />
      <fieldset className="mt-2 flex flex-col gap-4 border-t border-border pt-5">
        <legend className="sr-only">Cambiar contraseña</legend>
        <p className="text-sm font-semibold text-fg">Cambiar contraseña</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nueva contraseña (opcional)"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...form.register('password')}
          />
          <Input
            label="Repite la nueva contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          <Save aria-hidden="true" className="size-4" />
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

export function ProfilePage() {
  const user = useSessionStore((state) => state.user)
  return (
    <div className="flex flex-col gap-8">
      <PageMeta title="Mi perfil" description="Consulta y actualiza los datos de tu cuenta." />
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mi perfil"
        description="Mantén tus datos al día para recibir tus entradas a tu nombre."
      />
      {user && (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="flex flex-col items-center gap-4 text-center lg:self-start">
            <Avatar name={`${user.firstName} ${user.lastName}`} className="size-20 text-xl" />
            <div className="flex flex-col gap-1">
              <p className="font-display text-lg font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm break-all text-fg-muted">{user.contactEmail}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                Tipo de cuenta
              </span>
              <Badge tone="brand">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                {roleLabels[user.role]}
              </Badge>
            </div>
            <p className="text-xs text-fg-muted">Miembro desde {formatDate(user.createdAt)}</p>
          </Card>
          <Card>
            <ProfileForm key={user.updatedAt} user={user} />
          </Card>
        </div>
      )}
    </div>
  )
}

import { UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageMeta } from '../../../app/PageMeta'
import { FormAlert } from '../../../components/FormAlert'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../components/ui/use-toast'
import { applyServerErrors } from '../../../lib/form-errors'
import { zodResolver } from '../../../lib/zod-resolver'
import { registerSchema, toCreateUserRequest, type RegisterValues } from '../api/form-schemas'
import { AuthShell } from '../components/AuthShell'
import { PersonFields } from '../components/PersonFields'
import { textLink } from '../components/text-link'
import { useRegister } from '../hooks/use-auth-mutations'

const emptyForm: RegisterValues = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  contactPhone: '',
  contactEmail: '',
  password: '',
  confirmPassword: '',
}

const FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'contactPhone',
  'contactEmail',
  'password',
] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const registerUser = useRegister()
  const form = useForm({ resolver: zodResolver(registerSchema()), defaultValues: emptyForm })
  const { errors, isSubmitting } = form.formState
  const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'

  const submit = form.handleSubmit(async (values) => {
    try {
      await registerUser.mutateAsync(toCreateUserRequest(values))
      toast.show({
        tone: 'success',
        title: 'Cuenta creada',
        description: 'Ya puedes iniciar sesión con tu email y contraseña.',
      })
      navigate(loginUrl)
    } catch (error) {
      applyServerErrors(error, form.setError, {
        fields: FIELDS,
        statusFields: { 409: { field: 'contactEmail', message: 'Este email ya está registrado.' } },
      })
    }
  })

  return (
    <>
      <PageMeta
        title="Crear cuenta"
        description="Regístrate en Booqi para reservar entradas en tus eventos favoritos."
      />
      <AuthShell
        title="Crea tu cuenta"
        description="Solo te llevará un minuto. Después podrás reservar tus entradas."
        footer={
          <>
            ¿Ya tienes cuenta?{' '}
            <Link to={loginUrl} className={textLink}>
              Inicia sesión
            </Link>
          </>
        }
      >
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <FormAlert message={errors.root?.server?.message} />
          <PersonFields register={form.register} errors={errors} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...form.register('password')}
            />
            <Input
              label="Repite la contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...form.register('confirmPassword')}
            />
          </div>
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            <UserPlus aria-hidden="true" className="size-5" />
            Crear cuenta
          </Button>
        </form>
      </AuthShell>
    </>
  )
}

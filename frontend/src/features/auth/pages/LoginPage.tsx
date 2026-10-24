import { LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageMeta } from '../../../app/PageMeta'
import { FormAlert } from '../../../components/FormAlert'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { applyServerErrors } from '../../../lib/form-errors'
import { zodResolver } from '../../../lib/zod-resolver'
import { loginSchema, type LoginValues } from '../api/form-schemas'
import { AuthShell } from '../components/AuthShell'
import { textLink } from '../components/text-link'
import { resolvePostLoginPath } from '../hooks/access'
import { useLogin } from '../hooks/use-auth-mutations'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const login = useLogin()
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { contactEmail: '', password: '' } satisfies LoginValues,
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    try {
      const user = await login.mutateAsync(values)
      navigate(resolvePostLoginPath(user, redirect), { replace: true })
    } catch (error) {
      applyServerErrors(error, form.setError, {
        fields: ['contactEmail', 'password'],
        statusMessages: { 401: 'Email o contraseña incorrectos.' },
      })
    }
  })

  const registerUrl = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'

  return (
    <>
      <PageMeta
        title="Iniciar sesión"
        description="Accede a tu cuenta de Booqi para reservar y consultar tus entradas."
      />
      <AuthShell
        title="Hola de nuevo"
        description="Inicia sesión para reservar entradas y ver tus reservas."
        footer={
          <>
            ¿Aún no tienes cuenta?{' '}
            <Link to={registerUrl} className={textLink}>
              Crea una cuenta
            </Link>
          </>
        }
      >
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <FormAlert message={errors.root?.server?.message} />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.contactEmail?.message}
            {...form.register('contactEmail')}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...form.register('password')}
          />
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            <LogIn aria-hidden="true" className="size-5" />
            Iniciar sesión
          </Button>
        </form>
      </AuthShell>
    </>
  )
}

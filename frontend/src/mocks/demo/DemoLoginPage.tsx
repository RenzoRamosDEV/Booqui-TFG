import { useNavigate, useSearchParams } from 'react-router'
import { resolvePostLoginPath } from '../../features/auth/hooks/access'
import { useLogin } from '../../features/auth/hooks/use-auth-mutations'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { DemoLoginButtons } from './DemoLoginButtons'
import type { DemoAccount } from './seed'

export function DemoLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useLogin()

  async function enterAs(account: DemoAccount) {
    const user = await login.mutateAsync({
      contactEmail: account.email,
      password: account.password,
    })
    navigate(resolvePostLoginPath(user, params.get('redirect')), { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-5xl">
        <DemoLoginButtons disabled={login.isPending} onPick={(account) => void enterAs(account)} />
      </div>
      <LoginPage />
    </div>
  )
}

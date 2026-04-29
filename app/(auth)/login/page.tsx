import { AuthCard } from '../_components/auth-card'
import { LoginForm } from './_components/login-form'

interface PageProps {
  searchParams: Promise<{ erro?: string }>
}

const ERROS_URL: Record<string, string> = {
  link_invalido: 'Link inválido ou expirado. Solicite um novo.',
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { erro } = await searchParams
  const erroUrl = erro ? (ERROS_URL[erro] ?? 'Ocorreu um erro. Tente novamente.') : undefined

  return (
    <AuthCard titulo="Entrar" descricao="Análise de variabilidade da pressão arterial">
      <LoginForm erroUrl={erroUrl} />
    </AuthCard>
  )
}

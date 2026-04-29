import { AuthCard } from '../_components/auth-card'
import { CadastroForm } from './_components/cadastro-form'

export default function CadastroPage() {
  return (
    <AuthCard titulo="Criar conta" descricao="Crie a sua conta para começar.">
      <CadastroForm />
    </AuthCard>
  )
}

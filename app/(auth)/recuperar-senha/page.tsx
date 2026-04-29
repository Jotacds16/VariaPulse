import { AuthCard } from '../_components/auth-card'
import { RecuperarSenhaForm } from './_components/recuperar-senha-form'

export default function RecuperarSenhaPage() {
  return (
    <AuthCard
      titulo="Recuperar senha"
      descricao="Informe o seu email para receber um link de recuperação."
    >
      <RecuperarSenhaForm />
    </AuthCard>
  )
}

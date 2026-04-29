'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ERROS: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Confirme o seu email antes de entrar.',
  'User already registered': 'Este email já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Email inválido.',
  'signup_disabled': 'Cadastro temporariamente desativado.',
}

function traduzir(msg: string) {
  return ERROS[msg] ?? 'Ocorreu um erro. Tente novamente.'
}

export async function loginAction(fd: FormData): Promise<{ erro: string }> {
  const email = (fd.get('email') as string ?? '').trim()
  const senha = fd.get('senha') as string ?? ''

  if (!email || !senha) return { erro: 'Preencha email e senha.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) return { erro: traduzir(error.message) }

  redirect('/analises')
}

export async function cadastroAction(
  fd: FormData
): Promise<{ erro: string } | { sucesso: string }> {
  const email = (fd.get('email') as string ?? '').trim()
  const senha = fd.get('senha') as string ?? ''
  const confirmar = fd.get('confirmar') as string ?? ''

  if (!email || !senha || !confirmar) return { erro: 'Preencha todos os campos.' }
  if (senha !== confirmar) return { erro: 'As senhas não coincidem.' }
  if (senha.length < 6) return { erro: 'A senha deve ter pelo menos 6 caracteres.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password: senha })

  if (error) return { erro: traduzir(error.message) }

  return { sucesso: 'Cadastro realizado. Verifique o seu email para confirmar a conta.' }
}

export async function recuperarSenhaAction(
  fd: FormData
): Promise<{ erro: string } | { sucesso: string }> {
  const email = (fd.get('email') as string ?? '').trim()

  if (!email) return { erro: 'Informe o seu email.' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  })

  if (error) return { erro: traduzir(error.message) }

  return { sucesso: 'Email de recuperação enviado. Verifique a sua caixa de entrada.' }
}

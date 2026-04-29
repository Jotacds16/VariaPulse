import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ error?: string; error_code?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { error_code } = await searchParams

  if (error_code === 'otp_expired' || error_code === 'access_denied') {
    redirect('/login?erro=link_invalido')
  }

  redirect('/analises')
}

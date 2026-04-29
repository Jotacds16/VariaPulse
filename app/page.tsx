import { redirect } from 'next/navigation'

// Raiz redireciona — o middleware decide para onde
export default function HomePage() {
  redirect('/analises')
}

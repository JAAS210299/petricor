import Link from 'next/link'
import { Home, User, PlusSquare } from 'lucide-react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stone-950">
      {children}

      {/* Barra de navegación inferior (estilo móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t border-stone-800 px-8 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/feed" className="text-stone-400 hover:text-stone-200 transition-colors">
            <Home size={22} />
          </Link>
          <Link href="/nuevo" className="text-stone-400 hover:text-stone-200 transition-colors">
            <PlusSquare size={22} />
          </Link>
          <Link href="/perfil" className="text-stone-400 hover:text-stone-200 transition-colors">
            <User size={22} />
          </Link>
        </div>
      </nav>
    </div>
  )
}
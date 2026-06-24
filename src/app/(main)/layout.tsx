import Link from 'next/link'
import { Home, User, PlusSquare, Search, MessageCircle } from 'lucide-react'
import NotifBadge from '@/components/NotifBadge'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {children}
      <nav className="fixed bottom-0 left-0 right-0 border-t px-6 py-4" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/feed" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity"><Home size={22} /></Link>
          <Link href="/buscar" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity"><Search size={22} /></Link>
          <Link href="/nuevo" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity"><PlusSquare size={22} /></Link>
          <Link href="/mensajes" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity"><MessageCircle size={22} /></Link>
          <NotifBadge />
          <Link href="/perfil" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity"><User size={22} /></Link>
        </div>
      </nav>
    </div>
  )
}
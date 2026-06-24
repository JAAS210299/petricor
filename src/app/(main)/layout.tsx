import { createServerSupabaseClient } from '@/lib/supabase/server'
import NotifBadge from '@/components/NotifBadge'
import Link from 'next/link'
import { Home, Search, PlusSquare, MessageCircle, User, Bell } from 'lucide-react'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialCount = 0
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    initialCount = count || 0
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {children}
      <nav className="fixed bottom-0 left-0 right-0 border-t px-6 py-4" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/feed" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
            <Home size={22} />
          </Link>
          <Link href="/buscar" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
            <Search size={22} />
          </Link>
          <Link href="/nuevo" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
            <PlusSquare size={22} />
          </Link>
          <Link href="/mensajes" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
            <MessageCircle size={22} />
          </Link>
          {user ? (
            <NotifBadge userId={user.id} initialCount={initialCount} />
          ) : (
            <Link href="/notificaciones" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
              <Bell size={22} />
            </Link>
          )}
          <Link href="/perfil" style={{ color: 'var(--text-muted)' }} className="hover:opacity-70 transition-opacity">
            <User size={22} />
          </Link>
        </div>
      </nav>
    </div>
  )
}
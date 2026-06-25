import { createServerSupabaseClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import NotifBadge from '@/components/NotifBadge'
import MensajesBadge from '@/components/MensajesBadge'
import Link from 'next/link'
import { Home, Search, PlusSquare, User } from 'lucide-react'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const enChat = pathname.startsWith('/mensajes/') && pathname !== '/mensajes'

  let notifCount = 0
  let mensajesCount = 0

  if (user && !enChat) {
    const { count: nc } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    notifCount = nc || 0

    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (convs && convs.length > 0) {
      const convIds = convs.map(c => c.id)
      const { count: mc } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('read', false)
        .neq('sender_id', user.id)
      mensajesCount = mc || 0
    }
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
          {user ? (
            <MensajesBadge userId={user.id} initialCount={mensajesCount} />
          ) : (
            <Link href="/mensajes" style={{ color: 'var(--text-muted)' }}>
              <User size={22} />
            </Link>
          )}
          {user ? (
            <NotifBadge userId={user.id} initialCount={notifCount} />
          ) : (
            <Link href="/notificaciones" style={{ color: 'var(--text-muted)' }}>
              <User size={22} />
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
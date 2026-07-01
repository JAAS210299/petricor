import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, MessageCircle, UserPlus, CornerDownRight, AtSign } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default async function NotificacionesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`*, notifier:profiles!notifications_notifier_id_fkey (username, avatar_url)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .then(() => {})

  const iconMap: Record<string, ReactNode> = {
    like:         <Heart size={14} style={{ color: '#fb7185' }} />,
    comment_like: <Heart size={14} style={{ color: '#fb7185' }} />,
    comment:      <MessageCircle size={14} style={{ color: '#60a5fa' }} />,
    reply:        <CornerDownRight size={14} style={{ color: '#a78bfa' }} />,
    mention:      <AtSign size={14} style={{ color: '#34d399' }} />,
    follow:       <UserPlus size={14} style={{ color: '#4ade80' }} />,
  }

  const textMap: Record<string, string> = {
    like:         'le dio me gusta a tu publicación',
    comment_like: 'le dio me gusta a tu comentario',
    comment:      'comentó tu publicación',
    reply:        'respondió a tu comentario',
    mention:      'te mencionó en una publicación',
    follow:       'empezó a seguirte',
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          notificaciones
        </h1>

        <div className="flex flex-col gap-2">
          {(!notifications || notifications.length === 0) && (
            <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
              aún no tienes notificaciones
            </p>
          )}
          {notifications?.map(n => (
            <Link
              key={n.id}
              href={n.post_id ? `/post/${n.post_id}` : `/perfil/${(n.notifier as any)?.username}`}
              className="flex items-center gap-3 rounded-xl p-4 transition-opacity hover:opacity-80"
              style={{
                background: n.is_read ? 'var(--bg-card)' : 'var(--bg-input)',
                border: '1px solid var(--border)',
                opacity: n.is_read ? 0.75 : 1,
              }}
            >
              {(n.notifier as any)?.avatar_url ? (
                <img src={(n.notifier as any).avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                  {(n.notifier as any)?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  <span className="font-medium">@{(n.notifier as any)?.username}</span>
                  {' '}{textMap[n.type] ?? n.type}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(n.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="shrink-0">{iconMap[n.type]}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
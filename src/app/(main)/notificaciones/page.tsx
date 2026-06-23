import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default async function NotificacionesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`*, actor:profiles!notifications_actor_id_fkey (username)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Marcar todas como leídas
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  const iconMap: Record<string, JSX.Element> = {
    like: <Heart size={14} className="text-rose-400" />,
    comment: <MessageCircle size={14} className="text-blue-400" />,
    follow: <UserPlus size={14} className="text-green-400" />,
  }

  const textMap: Record<string, string> = {
    like: 'le dio me gusta a tu publicación',
    comment: 'comentó tu publicación',
    follow: 'empezó a seguirte',
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest text-stone-500 mb-8">
          notificaciones
        </h1>

        <div className="flex flex-col gap-2">
          {(!notifications || notifications.length === 0) && (
            <p className="text-stone-600 text-sm text-center mt-12">
              aún no tienes notificaciones
            </p>
          )}
          {notifications?.map(n => (
            <Link
              key={n.id}
              href={n.post_id ? `/post/${n.post_id}` : `/perfil/${(n.actor as any)?.username}`}
              className={`flex items-center gap-3 rounded-xl p-4 transition-colors ${
                n.read ? 'bg-stone-900/50' : 'bg-stone-900 border border-stone-700'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs text-stone-300 shrink-0">
                {(n.actor as any)?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-300 text-sm">
                  <span className="font-medium">@{(n.actor as any)?.username}</span>
                  {' '}{textMap[n.type]}
                </p>
                <p className="text-stone-600 text-xs mt-0.5">
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
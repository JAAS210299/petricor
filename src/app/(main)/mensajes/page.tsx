import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      user1:profiles!conversations_user1_id_fkey (id, username, avatar_url),
      user2:profiles!conversations_user2_id_fkey (id, username, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          mensajes
        </h1>

        <div className="flex flex-col gap-2">
          {(!conversations || conversations.length === 0) && (
            <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
              aún no tienes conversaciones
            </p>
          )}
          {conversations?.map(conv => {
            const other = (conv.user1 as any)?.id === user.id
              ? conv.user2 as any
              : conv.user1 as any

            return (
              <Link
                key={conv.id}
                href={`/mensajes/${conv.id}`}
                className="flex items-center gap-3 rounded-xl p-4 border transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                {other?.avatar_url ? (
                  <img src={other.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {other?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm" style={{ color: 'var(--text)' }}>@{other?.username}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
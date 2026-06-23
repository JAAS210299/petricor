import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      user1:profiles!conversations_user1_id_fkey (id, username),
      user2:profiles!conversations_user2_id_fkey (id, username)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest text-stone-500 mb-8">
          mensajes
        </h1>

        <div className="flex flex-col gap-2">
          {(!conversations || conversations.length === 0) && (
            <p className="text-stone-600 text-sm text-center mt-12">
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
                className="flex items-center gap-3 bg-stone-900 rounded-xl p-4 border border-stone-800 hover:border-stone-600 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-sm text-stone-300">
                  {other?.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-stone-200 text-sm">@{other?.username}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
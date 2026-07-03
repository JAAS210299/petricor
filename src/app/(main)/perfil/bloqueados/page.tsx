import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BloqueadosLista from './BloqueadosLista'

export const dynamic = 'force-dynamic'

export default async function BloqueadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blocksData } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  const blockedIds = blocksData?.map(b => b.blocked_id) ?? []

  const { data: blockedProfiles } = blockedIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url, bio').in('id', blockedIds)
    : { data: [] }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link
          href="/perfil"
          className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm">perfil</span>
        </Link>

        <h1 className="text-sm font-light tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
          usuarios bloqueados
        </h1>

        <BloqueadosLista
          initialBlocked={blockedProfiles ?? []}
          currentUserId={user.id}
        />
      </div>
    </main>
  )
}
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GuardadosLista from './GuardadosLista'

export const dynamic = 'force-dynamic'

export default async function GuardadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: savedRows } = await supabase
    .from('saved_posts')
    .select('post_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const postIds = savedRows?.map(s => s.post_id) ?? []

  const { data: posts } = postIds.length > 0
    ? await supabase
        .from('posts')
        .select(`
          id, content, created_at, image_url, media_url, media_type, user_id,
          profiles (id, username, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .in('id', postIds)
    : { data: [] }

  // Mantener el orden de guardado (más reciente primero)
  const orderedPosts = postIds
    .map(id => posts?.find(p => p.id === id))
    .filter(Boolean)

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
          guardados
        </h1>

        <GuardadosLista initialPosts={orderedPosts as any[]} currentUserId={user.id} />
      </div>
    </main>
  )
}
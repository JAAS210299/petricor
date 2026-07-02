import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AudioPlayer from '@/components/AudioPlayer'
import ExplorarClient from './ExplorarClient'

export const dynamic = 'force-dynamic'

export default async function ExplorarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Posts populares: más likes en los últimos 7 días
  const { data: populares } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, media_url, media_type, image_url, user_id,
      profiles (id, username, avatar_url),
      likes (id),
      comments (id)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Ordenar por número de likes descendente
  const sorted = (populares ?? []).sort((a, b) => {
    const aLikes = (a.likes as any[])?.length ?? 0
    const bLikes = (b.likes as any[])?.length ?? 0
    return bLikes - aLikes
  }).slice(0, 30)

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
          explorar
        </h1>
        <ExplorarClient initialPosts={sorted} currentUserId={user.id} />
      </div>
    </main>
  )
}
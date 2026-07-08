import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExplorarClient, { type Post, type Profile } from './ExplorarClient'

export const dynamic = 'force-dynamic'

function countRows(rows: unknown) {
  return Array.isArray(rows) ? rows.length : 0
}

type PostRow = Omit<Post, 'profiles'> & {
  profiles: Profile | Profile[] | null
}

function normalizeProfile(profile: Profile | Profile[] | null | undefined) {
  return Array.isArray(profile) ? profile[0] ?? null : profile ?? null
}

function normalizePost(post: PostRow): Post {
  return {
    ...post,
    profiles: normalizeProfile(post.profiles),
  }
}

export default async function ExplorarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const sorted = (populares ?? []).map(post => normalizePost(post as PostRow)).sort((a, b) => {
    const aLikes = countRows(a.likes)
    const bLikes = countRows(b.likes)
    return bLikes - aLikes
  }).slice(0, 30)

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
          explorar
        </h1>
        <ExplorarClient initialPosts={sorted} />
      </div>
    </main>
  )
}

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoPost from './NuevoPost'
import FeedList from './FeedList'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = following?.map(f => f.following_id) ?? []

  const { data: blocksData } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)

  const blockedUserIds = new Set<string>()
  blocksData?.forEach(b => {
    if (b.blocker_id === user.id) blockedUserIds.add(b.blocked_id)
    if (b.blocked_id === user.id) blockedUserIds.add(b.blocker_id)
  })

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url, user_id, media_url, media_type, edited_at, views_count,
      profiles (id, username, avatar_url, is_verified),
      likes (id, user_id),
      comments (id)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  const filteredPosts = (posts ?? []).filter(p => !blockedUserIds.has(p.user_id))

  const { data: savedRows } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', user.id)
  const savedPostIds = new Set(savedRows?.map(s => s.post_id) ?? [])

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aFollowed = followingIds.includes((a.profiles as any)?.id)
    const bFollowed = followingIds.includes((b.profiles as any)?.id)
    if (aFollowed && !bFollowed) return -1
    if (!aFollowed && bFollowed) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          petricor
        </h1>
        <NuevoPost userId={user.id} />
        <div className="mt-8">
          <FeedList
            initialPosts={sortedPosts}
            followingIds={followingIds}
            userId={user.id}
            savedPostIds={Array.from(savedPostIds)}
          />
        </div>
      </div>
    </main>
  )
}
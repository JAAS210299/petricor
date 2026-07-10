import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoPost from './NuevoPost'
import FeedList from './FeedList'
import StoriesBar from '@/components/stories/StoriesBar'

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

  // Historias activas (no expiradas), excluyendo usuarios bloqueados
  const { data: storiesData } = await supabase
    .from('stories')
    .select('id, user_id, media_url, media_type, created_at, profiles(username, avatar_url)')
    .order('created_at', { ascending: true })

  const activeStories = (storiesData ?? []).filter(s => !blockedUserIds.has(s.user_id))

  const storyGroupsMap = new Map<string, { userId: string; username: string; avatarUrl: string | null; stories: any[] }>()
  activeStories.forEach((s: any) => {
    const uname = s.profiles?.username ?? ''
    if (!storyGroupsMap.has(s.user_id)) {
      storyGroupsMap.set(s.user_id, {
        userId: s.user_id,
        username: uname,
        avatarUrl: s.profiles?.avatar_url ?? null,
        stories: [],
      })
    }
    storyGroupsMap.get(s.user_id)!.stories.push({
      id: s.id, media_url: s.media_url, media_type: s.media_type, created_at: s.created_at,
    })
  })
  const storyGroups = Array.from(storyGroupsMap.values())

  const { data: viewedRows } = await supabase
    .from('story_views')
    .select('story_id')
    .eq('viewer_id', user.id)
  const viewedStoryIds = viewedRows?.map(v => v.story_id) ?? []

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          petricor
        </h1>
        <StoriesBar
          groups={storyGroups}
          currentUserId={user.id}
          viewedStoryIds={viewedStoryIds}
          currentUsername={myProfile?.username ?? ''}
          currentAvatarUrl={myProfile?.avatar_url ?? null}
        />
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
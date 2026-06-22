import { createServerSupabaseClient } from '@/lib/supabase/server'
import NuevoPost from './NuevoPost'
import LikeButton from '@/components/LikeButton'

export default async function FeedPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      profiles (username, avatar_url),
      likes (id, user_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest text-stone-500 mb-8">
          petricor
        </h1>

        <NuevoPost />

        <div className="mt-8 flex flex-col gap-4">
          {posts && posts.length === 0 && (
            <p className="text-stone-600 text-sm text-center mt-12">
              aún no hay publicaciones. sé el primero.
            </p>
          )}
          {posts?.map(post => {
            const likesArr = (post.likes as any[]) ?? []
            const likeCount = likesArr.length
            const liked = likesArr.some((l: any) => l.user_id === user?.id)

            return (
              <div key={post.id} className="bg-stone-900 rounded-xl p-5 border border-stone-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs text-stone-300">
                    {(post.profiles as any)?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-stone-400 text-sm">
                    {(post.profiles as any)?.username}
                  </span>
                </div>
                <p className="text-stone-200 text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center justify-between mt-4">
                  <LikeButton
                    postId={post.id}
                    initialLikes={likeCount}
                    initialLiked={liked}
                    userId={user?.id ?? null}
                  />
                  <p className="text-stone-600 text-xs">
                    {new Date(post.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
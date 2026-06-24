import { createServerSupabaseClient } from '@/lib/supabase/server'
import NuevoPost from './NuevoPost'
import LikeButton from '@/components/LikeButton'
import Link from 'next/link'

export default async function FeedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url,
      profiles (username, avatar_url),
      likes (id, user_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-sm font-light tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
          petricor
        </h1>

        <NuevoPost />

        <div className="mt-8 flex flex-col gap-4">
          {posts && posts.length === 0 && (
            <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
              aún no hay publicaciones. sé el primero.
            </p>
          )}
          {posts?.map(post => {
            const likesArr = (post.likes as any[]) ?? []
            const likeCount = likesArr.length
            const liked = likesArr.some((l: any) => l.user_id === user?.id)

            return (
              <div key={post.id} className="rounded-xl border transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <Link href={`/post/${post.id}`} className="block p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                      {(post.profiles as any)?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {(post.profiles as any)?.username}
                    </span>
                  </div>
                  {post.content && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
                  )}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="imagen del post"
                      className="w-full rounded-lg mt-3 object-cover max-h-80"
                    />
                  )}
                </Link>
                <div className="flex items-center justify-between px-5 pb-4">
                  <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={user?.id ?? null} />
                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                    {new Date(post.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
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
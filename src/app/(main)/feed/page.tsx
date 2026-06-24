import { createServerSupabaseClient } from '@/lib/supabase/server'
import NuevoPost from './NuevoPost'
import LikeButton from '@/components/LikeButton'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url,
      profiles (username, avatar_url),
      likes (id, user_id),
      comments (id)
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
            const commentCount = (post.comments as any[])?.length ?? 0
            const username = (post.profiles as any)?.username
            const avatarUrl = (post.profiles as any)?.avatar_url

            return (
              <div key={post.id} className="rounded-xl border transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {/* Header — avatar y username clickable al perfil */}
                <div className="flex items-center gap-2 p-5 pb-0">
                  <Link href={`/perfil/${username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                        {username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{username}</span>
                  </Link>
                </div>

                {/* Contenido clickable al post */}
                <Link href={`/post/${post.id}`} className="block px-5 pt-3 pb-3">
                  {post.content && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
                  )}
                  {post.image_url && (
                    <img src={post.image_url} alt="imagen del post" className="w-full rounded-lg mt-3 object-cover max-h-80" />
                  )}
                </Link>

                {/* Acciones */}
                <div className="flex items-center gap-4 px-5 pb-4">
                  <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={user?.id ?? null} />
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}>
                    <MessageCircle size={15} />
                    <span className="text-xs">{commentCount}</span>
                  </div>
                  <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
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
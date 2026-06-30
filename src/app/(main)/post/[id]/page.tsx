import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ComentarioForm from './ComentarioForm'
import EliminarPost from './EliminarPost'
import AudioPlayer from '@/components/AudioPlayer'
import ComentariosLista from './ComentariosLista'
import PostBody from './PostBody'

export const dynamic = 'force-dynamic'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select(`*, profiles (username, avatar_url)`)
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      id, user_id, post_id, content, created_at, media_url, media_type, parent_id, edited_at,
      profiles (username, avatar_url),
      comment_likes (id, user_id)
    `)
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-xl mx-auto px-4 py-8">

        <Link href="/feed" className="flex items-center gap-2 mb-8 transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
          <span className="text-sm">volver</span>
        </Link>

        {/* Post */}
        <div className="rounded-xl p-5 border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <Link href={`/perfil/${(post.profiles as any)?.username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              {(post.profiles as any)?.avatar_url ? (
                <img src={(post.profiles as any).avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                  {(post.profiles as any)?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {(post.profiles as any)?.username}
              </span>
            </Link>
            {user && <EliminarPost postId={post.id} userId={user.id} ownerId={post.user_id} />}
          </div>

          <PostBody
            postId={post.id}
            userId={user?.id ?? null}
            ownerId={post.user_id}
            initialContent={post.content ?? ''}
            initialEditedAt={post.edited_at ?? null}
          />

          {post.media_url && post.media_type === 'image' && (
            <img src={post.media_url} alt="imagen del post" className="w-full rounded-lg mt-3 object-cover max-h-96" />
          )}
          {post.media_url && post.media_type === 'video' && (
            <video src={post.media_url} controls className="w-full rounded-lg mt-3 max-h-96" />
          )}
          {post.media_url && post.media_type === 'audio' && (
            <div className="mt-3">
              <AudioPlayer src={post.media_url} isOwn={false} />
            </div>
          )}
          {post.image_url && (
            <img src={post.image_url} alt="imagen del post" className="w-full rounded-lg mt-3 object-cover max-h-96" />
          )}
          <p className="text-xs mt-4" style={{ color: 'var(--text-subtle)' }}>
            {new Date(post.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        {/* Comentarios con replies y edición */}
        <ComentariosLista
          initialComments={comments ?? []}
          postId={id}
          userId={user?.id ?? null}
        />

        {user && <ComentarioForm postId={id} userId={user.id} />}

      </div>
    </main>
  )
}
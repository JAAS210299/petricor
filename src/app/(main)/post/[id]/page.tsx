import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ComentarioForm from './ComentarioForm'
import EliminarPost from './EliminarPost'
import EliminarComentario from './EliminarComentario'
import AudioPlayer from '@/components/AudioPlayer'

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
    .select(`id, user_id, post_id, content, created_at, media_url, media_type, profiles (username, avatar_url)`)
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
            {user && (
              <EliminarPost postId={post.id} userId={user.id} ownerId={post.user_id} />
            )}
          </div>
          {post.content && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
          )}
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

        {/* Comentarios */}
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-xs tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            {comments?.length ?? 0} comentarios
          </p>
          {comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Link href={`/perfil/${(comment.profiles as any)?.username}`}>
                {(comment.profiles as any)?.avatar_url ? (
                  <img src={(comment.profiles as any).avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {(comment.profiles as any)?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1">
                {/* Cabecera comentario: username + botón eliminar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {(comment.profiles as any)?.username}
                  </span>
                  {user && (
                    <EliminarComentario
                      comentarioId={comment.id}
                      userId={user.id}
                      ownerId={comment.user_id}
                    />
                  )}
                </div>
                {comment.content && (
                  <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text)' }}>{comment.content}</p>
                )}
                {comment.media_url && comment.media_type === 'image' && (
                  <img src={comment.media_url} alt="imagen" className="w-full rounded-lg mt-2 object-cover max-h-40" />
                )}
                {comment.media_url && comment.media_type === 'video' && (
                  <video src={comment.media_url} controls className="w-full rounded-lg mt-2 max-h-40" />
                )}
                {comment.media_url && comment.media_type === 'audio' && (
                  <div className="mt-2">
                    <AudioPlayer src={comment.media_url} isOwn={false} />
                  </div>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(comment.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {user && <ComentarioForm postId={id} userId={user.id} />}

      </div>
    </main>
  )
}
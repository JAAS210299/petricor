import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ComentarForm from './ComentarForm'

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
    .select(`*, profiles (username)`)
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select(`*, profiles (username)`)
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
              className="w-full rounded-lg mt-3 object-cover max-h-96"
            />
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
          {comments?.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                {(comment.profiles as any)?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {(comment.profiles as any)?.username}
                </span>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text)' }}>{comment.content}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(comment.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {user && <ComentarForm postId={id} userId={user.id} />}

      </div>
    </main>
  )
}
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
    <main className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">

        <Link href="/feed" className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors mb-8">
          <ArrowLeft size={18} />
          <span className="text-sm">volver</span>
        </Link>

        {/* Post */}
        <div className="bg-stone-900 rounded-xl p-5 border border-stone-800 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs text-stone-300">
              {(post.profiles as any)?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-stone-400 text-sm">{(post.profiles as any)?.username}</span>
          </div>
          <p className="text-stone-200 text-sm leading-relaxed">{post.content}</p>
          <p className="text-stone-600 text-xs mt-4">
            {new Date(post.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        {/* Comentarios */}
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-stone-500 text-xs tracking-wider mb-2">
            {comments?.length ?? 0} comentarios
          </p>
          {comments?.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-xs text-stone-400 shrink-0 mt-0.5">
                {(comment.profiles as any)?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-stone-400 text-xs font-medium">
                  {(comment.profiles as any)?.username}
                </span>
                <p className="text-stone-300 text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                <p className="text-stone-600 text-xs mt-1">
                  {new Date(comment.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario de comentario */}
        {user && <ComentarForm postId={id} userId={user.id} />}

      </div>
    </main>
  )
}
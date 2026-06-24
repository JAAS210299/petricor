// src/app/(main)/post/[id]/PostDetail.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, CornerDownRight } from 'lucide-react'
import LikeButton from '@/components/LikeButton'
import EliminarPost from './EliminarPost'
import { createClient } from '@/lib/supabase/client'

interface PostDetailProps {
  initialPost: any
  userId: string | null
}

export default function PostDetail({ initialPost, userId }: PostDetailProps) {
  const [post, setPost] = useState(initialPost)
  const [comments, setComments] = useState<any[]>(initialPost.comments || [])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()

  // Extraer datos del perfil del autor del post
  const author = post.profiles
  const likesArr = post.likes || []
  const liked = userId ? likesArr.some((l: any) => l.user_id === userId) : false

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting || !userId) return
    setSubmitting(true)

    try {
      // 1. Insertar el comentario en Supabase
      const { data: insertedComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: userId,
          content: newComment.trim()
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      if (insertedComment) {
        // 2. Traer el comentario con el perfil del usuario para pintarlo bien
        const { data: fullComment, error: fetchError } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, user_id,
            profiles (id, username, avatar_url)
          `)
          .eq('id', insertedComment.id)
          .single()

        if (fetchError) throw fetchError

        if (fullComment) {
          // Inyectamos el nuevo comentario al principio
          setComments(prev => [fullComment, ...prev])
          setNewComment('')
        }
      }
    } catch (error: any) {
      console.error('Error al comentar:', error.message || error)
      alert('No se pudo publicar el comentario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      {/* POST PRINCIPAL */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <Link href={`/perfil/${author?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                {author?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{author?.username}</p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </Link>
          
          {/* Botón de eliminar si eres el dueño (Corregido para TypeScript) */}
          {userId && userId === post.user_id && (
            <EliminarPost 
              postId={post.id} 
              userId={userId} 
              ownerId={post.user_id} 
            />
          )}
        </div>

        <div className="mb-4">
          {post.content && <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{post.content}</p>}
          {post.image_url && <img src={post.image_url} alt="Post media" className="w-full rounded-lg mt-4 object-cover max-h-[450px]" />}
        </div>

        <div className="flex items-center gap-6 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <LikeButton postId={post.id} initialLikes={likesArr.length} initialLiked={liked} userId={userId} />
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}>
            <MessageCircle size={16} />
            <span className="text-xs">{comments.length} comentarios</span>
          </div>
        </div>
      </div>

      {/* FORMULARIO PARA AGREGAR COMENTARIO */}
      {userId ? (
        <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe una respuesta con aroma a petricor..."
              className="w-full min-h-[60px] text-sm p-3 rounded-lg resize-none focus:outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
              disabled={submitting}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="text-xs font-medium px-4 py-2 rounded-full transition-all disabled:opacity-40"
                style={{ background: 'var(--text)', color: 'var(--bg)' }}
              >
                {submitting ? 'respondiendo...' : 'responder'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-center py-2" style={{ color: 'var(--text-subtle)' }}>
          Inicia sesión para poder comentar en esta publicación.
        </p>
      )}

      {/* LISTA DE COMENTARIOS */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold tracking-wider uppercase pl-1" style={{ color: 'var(--text-subtle)' }}>
          Respuestas
        </h3>
        
        {comments.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-subtle)' }}>
            Nadie ha respondido aún. Sé el primero en dejar tu huella.
          </p>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 rounded-xl border p-4 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="mt-1" style={{ color: 'var(--text-subtle)' }}>
                <CornerDownRight size={14} />
              </div>
              <Link href={`/perfil/${comment.profiles?.username}`} className="shrink-0">
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                    {comment.profiles?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {comment.profiles?.username}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                    {new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text)' }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
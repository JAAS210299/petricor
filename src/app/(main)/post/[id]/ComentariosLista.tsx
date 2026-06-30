'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AudioPlayer from '@/components/AudioPlayer'
import LikeComentarioButton from '@/components/LikeComentarioButton'
import EliminarComentario from './EliminarComentario'
import ReplyForm from './ReplyForm'
import TextConHashtags from '@/components/TextConHashtags'

interface Props {
  initialComments: any[]
  postId: string
  userId: string | null
}

export default function ComentariosLista({ initialComments, postId, userId }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const supabase = createClient()

  async function refreshComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, user_id, post_id, content, created_at, media_url, media_type, parent_id, profiles(username, avatar_url), comment_likes(id, user_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const topLevel = comments.filter((c: any) => !c.parent_id)
  const allReplies = comments.filter((c: any) => c.parent_id)
  const repliesMap: Record<string, any[]> = {}
  allReplies.forEach((r: any) => {
    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = []
    repliesMap[r.parent_id].push(r)
  })

  function renderComment(comment: any, isReply = false) {
    const cUsername = comment.profiles?.username
    const cAvatar = comment.profiles?.avatar_url
    const commentLikes = (comment.comment_likes as any[]) ?? []
    const likeCount = commentLikes.length
    const liked = commentLikes.some((l: any) => l.user_id === userId)
    const commentReplies = repliesMap[comment.id] ?? []

    return (
      <div key={comment.id} className={isReply ? 'ml-8 mt-2' : ''}>
        <div className="flex gap-3">
          <Link href={`/perfil/${cUsername}`}>
            {cAvatar ? (
              <img src={cAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                style={{ background: 'var(--bg-input)', color: 'var(--text)' }}>
                {cUsername?.[0]?.toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{cUsername}</span>
              <div className="flex items-center gap-2">
                <LikeComentarioButton
                  commentId={comment.id}
                  initialLikes={likeCount}
                  initialLiked={liked}
                  userId={userId}
                />
                {userId && (
                  <EliminarComentario
                    comentarioId={comment.id}
                    userId={userId}
                    ownerId={comment.user_id}
                  />
                )}
              </div>
            </div>

            {comment.content && (
              <TextConHashtags text={comment.content} style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text)', marginTop: '2px', display: 'block' }} />
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

            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                {new Date(comment.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
              {!isReply && userId && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  responder
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form de respuesta */}
        {replyingTo === comment.id && userId && (
          <ReplyForm
            postId={postId}
            userId={userId}
            parentId={comment.id}
            onSuccess={() => { setReplyingTo(null); refreshComments() }}
            onCancel={() => setReplyingTo(null)}
          />
        )}

        {/* Respuestas anidadas */}
        {commentReplies.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {commentReplies.map((reply: any) => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 mb-6">
      <p className="text-xs tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {topLevel.length} comentarios
      </p>
      {topLevel.map((c: any) => renderComment(c))}
    </div>
  )
}
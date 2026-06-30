'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AudioPlayer from '@/components/AudioPlayer'
import LikeComentarioButton from '@/components/LikeComentarioButton'
import EliminarComentario from './EliminarComentario'
import ReplyForm from './ReplyForm'
import TextConHashtags from '@/components/TextConHashtags'
import MentionTextarea from '@/components/MentionTextarea'

interface Props {
  initialComments: any[]
  postId: string
  userId: string | null
}

export default function ComentariosLista({ initialComments, postId, userId }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const supabase = createClient()

  async function refreshComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, user_id, post_id, content, created_at, media_url, media_type, parent_id, edited_at, profiles(username, avatar_url), comment_likes(id, user_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  function startEdit(comment: any) {
    setEditingId(comment.id)
    setEditDraft(comment.content ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  async function handleSaveEdit(commentId: string) {
    if (!editDraft.trim()) return
    setEditLoading(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: editDraft.trim(), edited_at: new Date().toISOString() })
      .eq('id', commentId)
    setEditLoading(false)
    if (error) {
      alert('Error al editar: ' + error.message)
      return
    }
    setEditingId(null)
    setEditDraft('')
    refreshComments()
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
    const isOwner = userId === comment.user_id
    const isEditing = editingId === comment.id

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
          <div className="flex-1 min-w-0">
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

            {isEditing ? (
              <div className="mt-1">
                <MentionTextarea
                  value={editDraft}
                  onChange={setEditDraft}
                  className="w-full bg-transparent text-sm outline-none resize-none"
                  style={{
                    color: 'var(--text)', lineHeight: '1.5',
                    background: 'var(--bg-input)', borderRadius: '8px',
                    padding: '6px 10px', border: '1px solid var(--border)'
                  }}
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={editLoading || !editDraft.trim()}
                    className="text-xs px-2.5 py-1 rounded-lg disabled:opacity-50"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}
                  >
                    {editLoading ? 'guardando...' : 'guardar'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    cancelar
                  </button>
                </div>
              </div>
            ) : (
              comment.content && (
                <span>
                  <TextConHashtags text={comment.content} style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text)', marginTop: '2px', display: 'inline' }} />
                  {comment.edited_at && (
                    <span className="text-xs ml-1" style={{ color: 'var(--text-subtle)' }}>(editado)</span>
                  )}
                </span>
              )
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

            {!isEditing && (
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
                {isOwner && (
                  <button
                    onClick={() => startEdit(comment)}
                    className="text-xs transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    editar
                  </button>
                )}
              </div>
            )}
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
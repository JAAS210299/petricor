'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, Pencil, Flag } from 'lucide-react'
import LikeButton from '@/components/LikeButton'
import LikeComentarioButton from '@/components/LikeComentarioButton'
import ComentarioInline from './ComentarioInline'
import AudioPlayer from '@/components/AudioPlayer'
import { createClient } from '@/lib/supabase/client'
import TextConHashtags from '@/components/TextConHashtags'
import MentionTextarea from '@/components/MentionTextarea'
import LazyImage from '@/components/LazyImage'
import ReportarModal from '@/components/ReportarModal'
import ShareButton from '@/components/ShareButton'

interface FeedListProps {
  initialPosts: any[]
  followingIds: string[]
  userId: string | null
}

export default function FeedList({ initialPosts = [], followingIds, userId }: FeedListProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts ?? [])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState((initialPosts ?? []).length === 20)
  const [openCommentId, setOpenCommentId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  // Edición de posts
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [postDraft, setPostDraft] = useState('')
  const [postEditLoading, setPostEditLoading] = useState(false)

  // Edición de comentarios
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentEditLoading, setCommentEditLoading] = useState(false)
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)

  const observerTarget = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setPosts(initialPosts ?? [])
  }, [initialPosts])

  async function loadComments(postId: string) {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, media_url, media_type, parent_id, user_id, edited_at, profiles(username, avatar_url), comment_likes(id, user_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setCommentsMap(prev => ({ ...prev, [postId]: data ?? [] }))
    setLoadingComments(false)
  }

  function toggleComments(postId: string) {
    if (!userId) return
    if (openCommentId === postId) {
      setOpenCommentId(null)
    } else {
      setOpenCommentId(postId)
      loadComments(postId)
    }
  }

  async function handleReply(postId: string, parentId: string) {
    if (!replyContent.trim() || !userId) return
    setReplyLoading(true)
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: replyContent.trim(),
      parent_id: parentId,
    })
    setReplyContent('')
    setReplyingTo(null)
    setReplyLoading(false)
    loadComments(postId)
  }

  // --- Edición de posts ---
  function startEditPost(post: any) {
    setEditingPostId(post.id)
    setPostDraft(post.content ?? '')
  }

  function cancelEditPost() {
    setEditingPostId(null)
    setPostDraft('')
  }

  async function handleSavePost(postId: string) {
    if (!postDraft.trim()) return
    setPostEditLoading(true)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('posts')
      .update({ content: postDraft.trim(), edited_at: now })
      .eq('id', postId)
    setPostEditLoading(false)
    if (error) {
      alert('Error al editar: ' + error.message)
      return
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: postDraft.trim(), edited_at: now } : p))
    setEditingPostId(null)
    setPostDraft('')
  }

  // --- Edición de comentarios ---
  function startEditComment(comment: any) {
    setEditingCommentId(comment.id)
    setCommentDraft(comment.content ?? '')
  }

  function cancelEditComment() {
    setEditingCommentId(null)
    setCommentDraft('')
  }

  async function handleSaveComment(postId: string, commentId: string) {
    if (!commentDraft.trim()) return
    setCommentEditLoading(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: commentDraft.trim(), edited_at: new Date().toISOString() })
      .eq('id', commentId)
    setCommentEditLoading(false)
    if (error) {
      alert('Error al editar: ' + error.message)
      return
    }
    setEditingCommentId(null)
    setCommentDraft('')
    loadComments(postId)
  }

  const loadMorePosts = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const start = posts.length
    const end = start + 19
    try {
      const response = await fetch(`/api/posts?start=${start}&end=${end}`)
      const newPosts = await response.json()
      if (newPosts && newPosts.length > 0) {
        setPosts(prev => {
          const merged = [...prev, ...newPosts]
          return merged.filter((p, i, self) => self.findIndex(x => x.id === p.id) === i)
        })
        if (newPosts.length < 20) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error cargando más posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts()
        }
      },
      { threshold: 0.5 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading, posts.length])

  function handleCommentSuccess(postId: string) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return { ...p, comments: [...((p.comments as any[]) ?? []), { id: 'temp' }] }
    }))
    loadComments(postId)
  }

  function renderComment(comment: any, postId: string, allComments: any[], isReply = false) {
    const cUsername = comment.profiles?.username
    const cAvatar = comment.profiles?.avatar_url
    const commentLikes = (comment.comment_likes as any[]) ?? []
    const likeCount = commentLikes.length
    const liked = commentLikes.some((l: any) => l.user_id === userId)
    const commentReplies = allComments.filter((c: any) => c.parent_id === comment.id)
    const isOwner = userId === comment.user_id
    const isEditingThis = editingCommentId === comment.id

    return (
      <div key={comment.id} style={{ marginLeft: isReply ? '32px' : '0', marginTop: isReply ? '8px' : '0' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Link href={`/perfil/${cUsername}`} style={{ flexShrink: 0 }}>
            {cAvatar ? (
              <img src={cAvatar} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--bg-input)', color: 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold', flexShrink: 0
              }}>
                {cUsername?.[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingThis ? (
              <div>
                <MentionTextarea
                  value={commentDraft}
                  onChange={setCommentDraft}
                  className="w-full bg-transparent outline-none resize-none"
                  style={{
                    width: '100%', fontSize: '13px', color: 'var(--text)', lineHeight: '1.4',
                    background: 'var(--bg-input)', borderRadius: '10px',
                    padding: '8px 12px', border: '1px solid var(--border)'
                  }}
                  rows={2}
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => handleSaveComment(postId, comment.id)}
                    disabled={commentEditLoading || !commentDraft.trim()}
                    style={{
                      fontSize: '11px', padding: '4px 10px', borderRadius: '8px',
                      background: 'var(--text)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
                      opacity: commentEditLoading || !commentDraft.trim() ? 0.5 : 1
                    }}
                  >
                    {commentEditLoading ? 'guardando...' : 'guardar'}
                  </button>
                  <button
                    onClick={cancelEditComment}
                    style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-input)', borderRadius: '12px',
                padding: '8px 12px', display: 'inline-block', maxWidth: '100%'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: comment.content ? '2px' : '0' }}>
                  {cUsername}
                </p>
                {comment.content && (
                  <span>
                    <TextConHashtags
                      text={comment.content}
                      style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4', display: 'inline' }}
                    />
                    {comment.edited_at && (
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginLeft: '4px' }}>(editado)</span>
                    )}
                  </span>
                )}
              </div>
            )}

            {comment.media_url && comment.media_type === 'image' && (
              <LazyImage
                src={comment.media_url}
                alt="imagen"
                className="rounded-lg mt-1.5"
                style={{ height: '140px', width: '100%' }}
              />
            )}
            {comment.media_url && comment.media_type === 'video' && (
              <video src={comment.media_url} controls style={{ display: 'block', marginTop: '6px', maxHeight: '120px', borderRadius: '8px', width: '100%' }} />
            )}
            {comment.media_url && comment.media_type === 'audio' && (
              <div style={{ marginTop: '6px' }}>
                <AudioPlayer src={comment.media_url} isOwn={false} />
              </div>
            )}

            {!isEditingThis && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', paddingLeft: '4px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                  {new Date(comment.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <LikeComentarioButton commentId={comment.id} initialLikes={likeCount} initialLiked={liked} userId={userId} />
                {!isReply && userId && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    responder
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => startEditComment(comment)}
                    style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    editar
                  </button>
                )}
                {!isOwner && userId && (
                  <button
                    onClick={() => setReportingCommentId(comment.id)}
                    style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    reportar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply form inline */}
        {replyingTo === comment.id && userId && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '38px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <MentionTextarea
                as="input"
                value={replyContent}
                onChange={setReplyContent}
                onKeyDown={e => e.key === 'Enter' && handleReply(postId, comment.id)}
                placeholder="responder... usa @ para mencionar"
                autoFocus
                style={{
                  width: '100%', fontSize: '13px', outline: 'none',
                  color: 'var(--text)', background: 'var(--bg-input)',
                  borderRadius: '8px', padding: '6px 10px',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
            <button
              onClick={() => handleReply(postId, comment.id)}
              disabled={replyLoading || !replyContent.trim()}
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: replyLoading || !replyContent.trim() ? 0.3 : 1 }}
            >
              <Send size={14} />
            </button>
            <button
              onClick={() => { setReplyingTo(null); setReplyContent('') }}
              style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              cancelar
            </button>
          </div>
        )}

        {/* Replies anidadas */}
        {commentReplies.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {commentReplies.map((reply: any) => renderComment(reply, postId, allComments, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.length === 0 && (
        <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
          aún no hay publicaciones. sé el primero.
        </p>
      )}
      {posts.map(post => {
        const likesArr = (post.likes as any[]) ?? []
        const likeCount = likesArr.length
        const liked = likesArr.some((l: any) => l.user_id === userId)
        const commentCount = (post.comments as any[])?.length ?? 0
        const username = (post.profiles as any)?.username
        const avatarUrl = (post.profiles as any)?.avatar_url
        const isFollowed = followingIds.includes((post.profiles as any)?.id)
        const isOpen = openCommentId === post.id
        const allComments = commentsMap[post.id] ?? []
        const topLevelComments = allComments.filter((c: any) => !c.parent_id)
        const isOwnPost = userId === post.user_id
        const isEditingPost = editingPostId === post.id

        return (
          <div key={post.id} className="rounded-xl border transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

            {/* Cabecera */}
            <div className="flex items-center justify-between p-5 pb-0">
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
              <div className="flex items-center gap-2">
                {isFollowed && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-input)', color: 'var(--text-subtle)' }}>
                    siguiendo
                  </span>
                )}
                {isOwnPost && !isEditingPost && post.content && (
                  <button
                    onClick={() => startEditPost(post)}
                    className="transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {!isOwnPost && userId && (
                  <button
                    onClick={() => setReportingPostId(post.id)}
                    className="transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    <Flag size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="px-5 pt-3 pb-3">
              {isEditingPost ? (
                <div onClick={e => e.stopPropagation()}>
                  <MentionTextarea
                    value={postDraft}
                    onChange={setPostDraft}
                    className="w-full bg-transparent text-sm outline-none resize-none"
                    style={{
                      color: 'var(--text)', lineHeight: '1.6',
                      background: 'var(--bg-input)', borderRadius: '8px',
                      padding: '8px 10px', border: '1px solid var(--border)'
                    }}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleSavePost(post.id)}
                      disabled={postEditLoading || !postDraft.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                      style={{ background: 'var(--text)', color: 'var(--bg)' }}
                    >
                      {postEditLoading ? 'guardando...' : 'guardar'}
                    </button>
                    <button
                      onClick={cancelEditPost}
                      className="text-xs transition-opacity hover:opacity-60"
                      style={{ color: 'var(--text-subtle)' }}
                    >
                      cancelar
                    </button>
                  </div>
                </div>
              ) : (
                post.content && (
                  <div onClick={() => router.push(`/post/${post.id}`)} className="cursor-pointer">
                    <TextConHashtags text={post.content} style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }} />
                    {post.edited_at && (
                      <span className="text-xs ml-1.5" style={{ color: 'var(--text-subtle)' }}>(editado)</span>
                    )}
                  </div>
                )
              )}

              {post.image_url && !post.media_url && (
                <Link href={`/post/${post.id}`} className="block mt-3">
                  <LazyImage src={post.image_url} alt="imagen" className="rounded-lg" style={{ height: '280px', width: '100%' }} />
                </Link>
              )}
              {post.media_url && post.media_type === 'image' && (
                <Link href={`/post/${post.id}`} className="block mt-3">
                  <LazyImage src={post.media_url} alt="imagen" className="rounded-lg" style={{ height: '280px', width: '100%' }} />
                </Link>
              )}
              {post.media_url && post.media_type === 'video' && (
                <video src={post.media_url} controls className="w-full rounded-lg mt-3 max-h-80" />
              )}
              {post.media_url && post.media_type === 'audio' && (
                <div className="mt-3">
                  <AudioPlayer src={post.media_url} isOwn={false} />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-4 px-5 pb-4">
              <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={userId} />
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
                style={{ color: isOpen ? 'var(--text)' : 'var(--text-subtle)' }}
              >
                <MessageCircle size={15} />
                <span className="text-xs">{commentCount}</span>
              </button>
              <ShareButton postId={post.id} />
              <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Panel comentarios */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {loadingComments && (
                  <p className="text-xs text-center py-4 animate-pulse" style={{ color: 'var(--text-subtle)' }}>
                    cargando comentarios...
                  </p>
                )}

                {!loadingComments && topLevelComments.length > 0 && (
                  <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topLevelComments.map((comment: any) => renderComment(comment, post.id, allComments))}
                  </div>
                )}

                {!loadingComments && topLevelComments.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-subtle)' }}>
                    sé el primero en comentar
                  </p>
                )}

                {userId && (
                  <ComentarioInline
                    postId={post.id}
                    userId={userId}
                    onSuccess={() => handleCommentSuccess(post.id)}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
        {loading && (
          <p className="text-xs tracking-widest animate-pulse" style={{ color: 'var(--text-subtle)' }}>
            cargando...
          </p>
        )}
      </div>

      {reportingPostId && userId && (
        <ReportarModal
          reporterId={userId}
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
        />
      )}
      {reportingCommentId && userId && (
        <ReportarModal
          reporterId={userId}
          commentId={reportingCommentId}
          onClose={() => setReportingCommentId(null)}
        />
      )}
    </div>
  )
}
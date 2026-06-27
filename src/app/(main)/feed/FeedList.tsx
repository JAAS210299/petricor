'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import LikeButton from '@/components/LikeButton'
import ComentarioInline from './ComentarioInline'
import AudioPlayer from '@/components/AudioPlayer'
import { createClient } from '@/lib/supabase/client'

interface FeedListProps {
  initialPosts: any[]
  followingIds: string[]
  userId: string | null
}

export default function FeedList({ initialPosts, followingIds, userId }: FeedListProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [openCommentId, setOpenCommentId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({})
  const [loadingComments, setLoadingComments] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  async function loadComments(postId: string) {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, media_url, media_type, profiles(username, avatar_url)')
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
    // Actualizar contador en el post
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const prevComments = (p.comments as any[]) ?? []
      return { ...p, comments: [...prevComments, { id: 'temp' }] }
    }))
    // Recargar comentarios del panel
    loadComments(postId)
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
        const comments = commentsMap[post.id] ?? []

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
              {isFollowed && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-input)', color: 'var(--text-subtle)' }}>
                  siguiendo
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="px-5 pt-3 pb-3">
              {post.content && (
                <Link href={`/post/${post.id}`} className="block">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
                </Link>
              )}
              {post.image_url && !post.media_url && (
                <Link href={`/post/${post.id}`} className="block mt-3">
                  <img src={post.image_url} alt="imagen" className="w-full rounded-lg object-cover max-h-80" />
                </Link>
              )}
              {post.media_url && post.media_type === 'image' && (
                <Link href={`/post/${post.id}`} className="block mt-3">
                  <img src={post.media_url} alt="imagen" className="w-full rounded-lg object-cover max-h-80" />
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
              <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Panel de comentarios */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>

                {loadingComments && (
                  <p className="text-xs text-center py-4 animate-pulse" style={{ color: 'var(--text-subtle)' }}>
                    cargando comentarios...
                  </p>
                )}

                {!loadingComments && comments.length > 0 && (
                  <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comments.map((comment: any) => {
                      const cUsername = comment.profiles?.username
                      const cAvatar = comment.profiles?.avatar_url
                      return (
                        <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
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
                            <div style={{
                              background: 'var(--bg-input)', borderRadius: '12px',
                              padding: '8px 12px', display: 'inline-block', maxWidth: '100%'
                            }}>
                              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: comment.content ? '2px' : '0' }}>
                                {cUsername}
                              </p>
                              {comment.content && (
                                <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4', margin: 0 }}>
                                  {comment.content}
                                </p>
                              )}
                            </div>

                            {comment.media_url && comment.media_type === 'image' && (
                              <img src={comment.media_url} alt="imagen" style={{ display: 'block', marginTop: '6px', maxHeight: '160px', borderRadius: '8px', objectFit: 'cover' }} />
                            )}
                            {comment.media_url && comment.media_type === 'video' && (
                              <video src={comment.media_url} controls style={{ display: 'block', marginTop: '6px', maxHeight: '160px', borderRadius: '8px', width: '100%' }} />
                            )}
                            {comment.media_url && comment.media_type === 'audio' && (
                              <div style={{ marginTop: '6px' }}>
                                <AudioPlayer src={comment.media_url} isOwn={false} />
                              </div>
                            )}

                            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px', paddingLeft: '4px' }}>
                              {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!loadingComments && comments.length === 0 && (
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
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import LikeButton from '@/components/LikeButton'

interface FeedListProps {
  initialPosts: any[]
  followingIds: string[]
  userId: string | null
}

export default function FeedList({ initialPosts, followingIds, userId }: FeedListProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

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

        return (
          <div key={post.id} className="rounded-xl border transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
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

            <Link href={`/post/${post.id}`} className="block px-5 pt-3 pb-3">
              {post.content && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{post.content}</p>
              )}
              {post.image_url && (
                <img src={post.image_url} alt="imagen" className="w-full rounded-lg mt-3 object-cover max-h-80" />
              )}
            </Link>

            <div className="flex items-center gap-4 px-5 pb-4">
              <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={userId} />
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
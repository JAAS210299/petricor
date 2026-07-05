'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AudioPlayer from '@/components/AudioPlayer'
import LikeButton from '@/components/LikeButton'
import SaveButton from '@/components/SaveButton'
import TextConHashtags from '@/components/TextConHashtags'

interface Props {
  initialPosts: any[]
  currentUserId: string
}

export default function GuardadosLista({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const router = useRouter()

  function handleUnsave(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
        aún no has guardado ninguna publicación
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map(post => {
        const likesArr = (post.likes as any[]) ?? []
        const likeCount = likesArr.length
        const liked = likesArr.some((l: any) => l.user_id === currentUserId)
        const username = (post.profiles as any)?.username
        const avatarUrl = (post.profiles as any)?.avatar_url

        return (
          <div key={post.id} className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
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
              <SaveButton
                postId={post.id}
                userId={currentUserId}
                initialSaved={true}
                size={17}
                onToggle={(nowSaved) => { if (!nowSaved) handleUnsave(post.id) }}
              />
            </div>

            <div onClick={() => router.push(`/post/${post.id}`)} className="px-5 pt-3 pb-3 cursor-pointer">
              {post.content && (
                <TextConHashtags text={post.content} style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }} />
              )}
              {post.image_url && !post.media_url && (
                <img src={post.image_url} alt="imagen" loading="lazy" className="w-full rounded-lg mt-3 object-cover max-h-80" />
              )}
              {post.media_url && post.media_type === 'image' && (
                <img src={post.media_url} alt="imagen" loading="lazy" className="w-full rounded-lg mt-3 object-cover max-h-80" />
              )}
              {post.media_url && post.media_type === 'video' && (
                <video src={post.media_url} controls className="w-full rounded-lg mt-3 max-h-80" onClick={e => e.stopPropagation()} />
              )}
              {post.media_url && post.media_type === 'audio' && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <AudioPlayer src={post.media_url} isOwn={false} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 px-5 pb-4">
              <LikeButton postId={post.id} initialLikes={likeCount} initialLiked={liked} userId={currentUserId} />
              <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
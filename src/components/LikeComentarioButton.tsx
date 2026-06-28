'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

interface Props {
  commentId: string
  initialLikes: number
  initialLiked: boolean
  userId: string | null
}

export default function LikeComentarioButton({ commentId, initialLikes, initialLiked, userId }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLike() {
    if (!userId || loading) return
    setLoading(true)

    if (liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
      setLiked(false)
      setLikes(l => l - 1)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
      setLiked(true)
      setLikes(l => l + 1)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={!userId}
      className="flex items-center gap-1 transition-colors disabled:opacity-30"
      style={{ color: liked ? '#fb7185' : 'var(--text-subtle)' }}
    >
      <Heart
        size={12}
        fill={liked ? '#fb7185' : 'none'}
        stroke={liked ? '#fb7185' : 'currentColor'}
      />
      {likes > 0 && <span className="text-xs">{likes}</span>}
    </button>
  )
}
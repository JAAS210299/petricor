'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  postId: string
  initialLikes: number
  initialLiked: boolean
  userId: string | null
}

export default function LikeButton({ postId, initialLikes, initialLiked, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLike() {
    if (!userId || loading) return
    setLoading(true)

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      setLiked(false)
      setLikes(l => l - 1)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      setLiked(true)
      setLikes(l => l + 1)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={!userId}
      className="flex items-center gap-1.5 text-stone-500 hover:text-rose-400 transition-colors disabled:opacity-30"
    >
      <Heart
        size={15}
        className={liked ? 'fill-rose-400 text-rose-400' : ''}
      />
      <span className="text-xs">{likes}</span>
    </button>
  )
}
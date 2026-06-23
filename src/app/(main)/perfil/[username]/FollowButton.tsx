'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  followerId: string
  followingId: string
  initialFollowing: boolean
}

export default function FollowButton({ followerId, followingId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleFollow() {
    setLoading(true)
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId
      })
      setFollowing(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        following
          ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          : 'bg-stone-200 text-stone-900 hover:bg-white'
      }`}
    >
      {loading ? '...' : following ? 'siguiendo' : 'seguir'}
    </button>
  )
}
// src/components/FollowButton.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
}

export default function FollowButton({ targetUserId, currentUserId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(!!currentUserId && currentUserId !== targetUserId)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    if (!currentUserId || currentUserId === targetUserId) return

    let cancelled = false

    async function loadFollowStatus() {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (cancelled) return
      if (!error) setIsFollowing(!!data)
      setLoading(false)
    }

    loadFollowStatus()

    return () => {
      cancelled = true
    }
  }, [currentUserId, targetUserId, supabase])

  // No mostrar el botón si miras tu propio perfil
  if (currentUserId === targetUserId) return null

  const handleFollow = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    setLoading(true)

    if (isFollowing) {
      // Dejar de seguir
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)

      if (!error) {
        setIsFollowing(false)
        router.refresh() // Refresca contadores del perfil si los hubiera
      }
    } else {
      // Seguir
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId
        })

      if (!error) {
        setIsFollowing(true)
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
        isFollowing
          ? 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-stone-200'
          : 'bg-stone-20 text-stone-950 hover:bg-stone-300'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isFollowing ? 'siguiendo' : 'seguir'}
    </button>
  )
}

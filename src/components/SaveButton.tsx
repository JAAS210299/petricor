'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark } from 'lucide-react'

interface Props {
  postId: string
  userId: string | null
  initialSaved: boolean
  size?: number
  onToggle?: (saved: boolean) => void
}

export default function SaveButton({ postId, userId, initialSaved, size = 15, onToggle }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId || loading) return
    setLoading(true)

    if (saved) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)
      if (!error) {
        setSaved(false)
        onToggle?.(false)
      }
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: userId, post_id: postId })
      if (!error) {
        setSaved(true)
        onToggle?.(true)
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!userId}
      className="transition-opacity hover:opacity-60 disabled:opacity-30"
      style={{ color: saved ? '#f59e0b' : 'var(--text-subtle)' }}
    >
      <Bookmark size={size} fill={saved ? '#f59e0b' : 'none'} />
    </button>
  )
}
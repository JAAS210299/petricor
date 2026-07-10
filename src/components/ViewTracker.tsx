'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  userId: string
}

export default function ViewTracker({ postId, userId }: Props) {
  const registered = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (registered.current) return
    registered.current = true

    // Insert silencioso: si ya existe la vista (constraint unique), simplemente falla y no pasa nada
    supabase
      .from('post_views')
      .insert({ post_id: postId, user_id: userId })
      .then(() => {})
  }, [postId, userId, supabase])

  return null
}
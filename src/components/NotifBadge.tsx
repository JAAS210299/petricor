'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface NotifBadgeProps {
  userId: string
  initialCount: number
}

export default function NotifBadge({ userId, initialCount }: NotifBadgeProps) {
  const [count, setCount] = useState(initialCount)
  const supabase = useMemo(() => createClient(), [])

  const fetchCount = useCallback(async () => {
    const { count: freshCount, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error && freshCount !== null) {
      setCount(freshCount)
    }
  }, [userId, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:nav_badge:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => { fetchCount() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, fetchCount])

  return (
    <Link href="/notificaciones" className="relative transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
      <Bell size={22} />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-medium">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}

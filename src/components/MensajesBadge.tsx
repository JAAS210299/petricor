'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

interface MensajesBadgeProps {
  userId: string
  initialCount: number
}

export default function MensajesBadge({ userId, initialCount }: MensajesBadgeProps) {
  const [count, setCount] = useState(initialCount)
  const supabase = createClient()
  const pathname = usePathname()
  const enChatRef = useRef(false)

  enChatRef.current = pathname.startsWith('/mensajes/') && pathname !== '/mensajes'
  const displayCount = enChatRef.current ? 0 : count

  const fetchCount = useCallback(async () => {
    if (enChatRef.current) return

    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (!convs || convs.length === 0) {
      setCount(0)
      return
    }

    const convIds = convs.map(c => c.id)
    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', userId)

    setCount(unread ?? 0)
  }, [userId, supabase])

  useEffect(() => {
    fetchCount()
  }, [pathname, fetchCount])

  useEffect(() => {
    window.addEventListener('mensajes-leidos', fetchCount)
    return () => window.removeEventListener('mensajes-leidos', fetchCount)
  }, [fetchCount])

  useEffect(() => {
    const channel = supabase
      .channel(`mensajes_badge:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => { fetchCount() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, fetchCount])

  return (
    <Link href="/mensajes" className="relative transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
      <MessageCircle size={22} />
      {displayCount > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-medium">
          {displayCount > 9 ? '9+' : displayCount}
        </span>
      ) : null}
    </Link> 
  )
} 
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Ban, ShieldCheck } from 'lucide-react'

interface Props {
  currentUserId: string
  targetUserId: string
  targetUsername: string
  initialBlocked: boolean
}

export default function BloquearButton({ currentUserId, targetUserId, targetUsername, initialBlocked }: Props) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleToggleBlock() {
    setLoading(true)

    if (blocked) {
      const confirmed = confirm(`¿Desbloquear a @${targetUsername}?`)
      if (!confirmed) { setLoading(false); return }

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId)

      if (error) {
        alert('Error al desbloquear: ' + error.message)
        setLoading(false)
        return
      }
      setBlocked(false)
    } else {
      const confirmed = confirm(`¿Bloquear a @${targetUsername}? No podrá ver tu perfil ni contactarte, y sus publicaciones dejarán de aparecer en tu feed.`)
      if (!confirmed) { setLoading(false); return }

      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId).eq('following_id', targetUserId)
      await supabase.from('follows').delete()
        .eq('follower_id', targetUserId).eq('following_id', currentUserId)

      const { error } = await supabase.from('blocks').insert({
        blocker_id: currentUserId,
        blocked_id: targetUserId,
      })

      if (error) {
        alert('Error al bloquear: ' + error.message)
        setLoading(false)
        return
      }
      setBlocked(true)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggleBlock}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
      style={
        blocked
          ? { background: 'var(--bg-input)', color: '#22c55e', border: '1px solid #22c55e33' }
          : { background: 'var(--bg-input)', color: '#ef4444', border: '1px solid #ef444433' }
      }
    >
      {blocked ? <ShieldCheck size={13} /> : <Ban size={13} />}
      {loading ? '...' : blocked ? 'bloqueado' : 'bloquear'}
    </button>
  )
}
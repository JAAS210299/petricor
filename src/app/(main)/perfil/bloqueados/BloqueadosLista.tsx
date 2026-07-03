'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

interface BlockedProfile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
}

interface Props {
  initialBlocked: BlockedProfile[]
  currentUserId: string
}

export default function BloqueadosLista({ initialBlocked, currentUserId }: Props) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const supabase = createClient()

  async function handleUnblock(id: string, username: string) {
    const confirmed = confirm(`¿Desbloquear a @${username}?`)
    if (!confirmed) return

    setUnblockingId(id)
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', id)

    if (error) {
      alert('Error al desbloquear: ' + error.message)
      setUnblockingId(null)
      return
    }

    setBlocked(prev => prev.filter(p => p.id !== id))
    setUnblockingId(null)
  }

  if (blocked.length === 0) {
    return (
      <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
        no has bloqueado a nadie
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {blocked.map(person => (
        <div
          key={person.id}
          className="flex items-center justify-between gap-3 rounded-xl p-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Link
            href={`/perfil/${person.username}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            {person.avatar_url ? (
              <img src={person.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
              >
                {person.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: 'var(--text)' }}>@{person.username}</p>
              {person.bio && (
                <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>{person.bio}</p>
              )}
            </div>
          </Link>

          <button
            onClick={() => handleUnblock(person.id, person.username)}
            disabled={unblockingId === person.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
            style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
          >
            <ShieldCheck size={13} />
            {unblockingId === person.id ? '...' : 'desbloquear'}
          </button>
        </div>
      ))}
    </div>
  )
}
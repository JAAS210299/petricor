'use client'

import { useState } from 'react'
import Link from 'next/link'
import FollowButton from '../FollowButton'

interface PersonaConexion {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
}

interface Props {
  initialTab: 'seguidores' | 'seguidos'
  seguidores: PersonaConexion[]
  seguidos: PersonaConexion[]
  currentUserId: string | null
  currentUserFollowingIds: string[]
}

export default function ConexionesTabs({
  initialTab,
  seguidores,
  seguidos,
  currentUserId,
  currentUserFollowingIds,
}: Props) {
  const [tab, setTab] = useState<'seguidores' | 'seguidos'>(initialTab)
  const list = tab === 'seguidores' ? seguidores : seguidos

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setTab('seguidores')}
          className="flex-1 text-sm py-3 transition-colors"
          style={{
            color: tab === 'seguidores' ? 'var(--text)' : 'var(--text-subtle)',
            borderBottom: tab === 'seguidores' ? '2px solid var(--text)' : '2px solid transparent',
            fontWeight: tab === 'seguidores' ? 600 : 400,
          }}
        >
          seguidores ({seguidores.length})
        </button>
        <button
          onClick={() => setTab('seguidos')}
          className="flex-1 text-sm py-3 transition-colors"
          style={{
            color: tab === 'seguidos' ? 'var(--text)' : 'var(--text-subtle)',
            borderBottom: tab === 'seguidos' ? '2px solid var(--text)' : '2px solid transparent',
            fontWeight: tab === 'seguidos' ? 600 : 400,
          }}
        >
          seguidos ({seguidos.length})
        </button>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {list.length === 0 && (
          <p className="text-sm text-center mt-12" style={{ color: 'var(--text-subtle)' }}>
            {tab === 'seguidores' ? 'aún no tiene seguidores' : 'aún no sigue a nadie'}
          </p>
        )}
        {list.map(person => {
          const isOwnRow = person.id === currentUserId
          const isFollowingPerson = currentUserFollowingIds.includes(person.id)
          return (
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

              {currentUserId && !isOwnRow && (
                <FollowButton
                  followerId={currentUserId}
                  followingId={person.id}
                  initialFollowing={isFollowingPerson}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
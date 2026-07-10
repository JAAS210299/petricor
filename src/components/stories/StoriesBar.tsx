'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import NuevaHistoria from './NuevaHistoria'
import StoryViewer from './StoryViewer'

interface Story {
  id: string
  media_url: string
  media_type: string
  created_at: string
}

interface StoryGroup {
  userId: string
  username: string
  avatarUrl: string | null
  stories: Story[]
}

interface Props {
  groups: StoryGroup[]
  currentUserId: string
  viewedStoryIds: string[]
  currentUsername: string
  currentAvatarUrl: string | null
}

export default function StoriesBar({ groups, currentUserId, viewedStoryIds, currentUsername, currentAvatarUrl }: Props) {
  const [showUpload, setShowUpload] = useState(false)
  const [viewerStartIndex, setViewerStartIndex] = useState<number | null>(null)
  const router = useRouter()

  const viewedSet = new Set(viewedStoryIds)
  const ownGroupFromData = groups.find(g => g.userId === currentUserId)
  const ownGroup = ownGroupFromData ?? {
    userId: currentUserId,
    username: currentUsername,
    avatarUrl: currentAvatarUrl,
    stories: [],
  }
  const otherGroups = groups.filter(g => g.userId !== currentUserId)

  // Ordenar: grupos con historias sin ver primero
  const sortedOtherGroups = [...otherGroups].sort((a, b) => {
    const aUnseen = a.stories.some(s => !viewedSet.has(s.id))
    const bUnseen = b.stories.some(s => !viewedSet.has(s.id))
    if (aUnseen && !bUnseen) return -1
    if (!aUnseen && bUnseen) return 1
    return 0
  })

  const displayGroups = [ownGroup, ...sortedOtherGroups]

  function hasUnseen(g: StoryGroup) {
    return g.stories.some(s => !viewedSet.has(s.id))
  }

  function openViewer(index: number) {
    setViewerStartIndex(index)
  }

  function handleUploadSuccess() {
    setShowUpload(false)
    router.refresh()
  }

  function handleOwnClick() {
    if (ownGroup.stories.length > 0) {
      openViewer(0)
    } else {
      setShowUpload(true)
    }
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {/* Tu historia / añadir */}
        <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: '64px' }}>
          <button
            onClick={handleOwnClick}
            style={{
              width: '58px', height: '58px', borderRadius: '50%',
              padding: '2px',
              background: ownGroup.stories.length > 0 && hasUnseen(ownGroup)
                ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                : 'var(--border)',
              position: 'relative',
            }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'var(--bg)', padding: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {ownGroup.avatarUrl ? (
                <img src={ownGroup.avatarUrl} alt="tu historia" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', fontSize: '16px',
                }}>
                  {ownGroup.username?.[0]?.toUpperCase() ?? '+'}
                </div>
              )}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#60a5fa', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onClick={(e) => { e.stopPropagation(); setShowUpload(true) }}
            >
              <Plus size={11} color="white" />
            </div>
          </button>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>tu historia</span>
        </div>

        {/* Otros usuarios */}
        {sortedOtherGroups.map((g) => {
          const unseen = hasUnseen(g)
          const displayIndex = displayGroups.findIndex(dg => dg.userId === g.userId)
          return (
            <div key={g.userId} className="flex flex-col items-center gap-1 shrink-0" style={{ width: '64px' }}>
              <button
                onClick={() => openViewer(displayIndex)}
                style={{
                  width: '58px', height: '58px', borderRadius: '50%', padding: '2px',
                  background: unseen ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' : 'var(--border)',
                }}
              >
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'var(--bg)', padding: '2px', overflow: 'hidden',
                }}>
                  {g.avatarUrl ? (
                    <img src={g.avatarUrl} alt={g.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text)', fontSize: '16px',
                    }}>
                      {g.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </button>
              <span className="text-xs truncate" style={{ color: 'var(--text-subtle)', maxWidth: '64px' }}>
                {g.username}
              </span>
            </div>
          )
        })}
      </div>

      {showUpload && (
        <NuevaHistoria
          userId={currentUserId}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {viewerStartIndex !== null && (
        <StoryViewer
          groups={displayGroups}
          startGroupIndex={viewerStartIndex}
          currentUserId={currentUserId}
          onClose={() => { setViewerStartIndex(null); router.refresh() }}
        />
      )}
    </>
  )
}
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2 } from 'lucide-react'

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
  startGroupIndex: number
  currentUserId: string
  onClose: () => void
}

const IMAGE_DURATION_MS = 5000

export default function StoryViewer({ groups, startGroupIndex, currentUserId, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)
  const supabase = createClient()

  const group = groups[groupIndex]
  const story = group?.stories[storyIndex]
  const isOwn = group?.userId === currentUserId

  const goNext = useCallback(() => {
    if (!group) return
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(i => i + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1)
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1]
      setGroupIndex(g => g - 1)
      setStoryIndex(prevGroup.stories.length - 1)
    }
  }, [storyIndex, groupIndex, groups])

  // Registrar vista
  useEffect(() => {
    if (!story) return
    supabase.from('story_views').insert({ story_id: story.id, viewer_id: currentUserId }).then(() => {})
  }, [story?.id, currentUserId, supabase])

  // Progreso automático
  useEffect(() => {
    if (!story || paused) return
    setProgress(0)
    startTimeRef.current = Date.now()

    if (story.media_type === 'video') {
      // El progreso del video se controla por su propio onTimeUpdate
      return
    }

    function tick() {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min((elapsed / IMAGE_DURATION_MS) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        goNext()
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [story?.id, paused, goNext])

  function handleVideoTimeUpdate() {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  function handleTapZone(e: React.MouseEvent, side: 'left' | 'right') {
    e.stopPropagation()
    if (side === 'left') goPrev()
    else goNext()
  }

  async function handleDeleteOwn() {
    if (!story) return
    const confirmed = confirm('¿Eliminar esta historia?')
    if (!confirmed) return
    await supabase.from('stories').delete().eq('id', story.id)
    goNext()
  }

  if (!group || !story) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        maxHeight: '100vh',
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Barras de progreso */}
        <div style={{ display: 'flex', gap: '4px', padding: '10px 10px 0', zIndex: 2 }}>
          {group.stories.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: '2.5px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'white',
                width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                transition: i === storyIndex ? 'none' : 'width 0.2s',
              }} />
            </div>
          ))}
        </div>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-3 py-3" style={{ zIndex: 2 }}>
          <Link href={`/perfil/${group.username}`} className="flex items-center gap-2">
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                {group.username[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{group.username}</span>
          </Link>
          <div className="flex items-center gap-3">
            {isOwn && (
              <button onClick={handleDeleteOwn} style={{ color: 'white' }}>
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} style={{ color: 'white' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'black' }}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {story.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={story.media_url}
              autoPlay
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={goNext}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={story.media_url}
              alt="historia"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Zonas de tap invisibles */}
          <div onClick={(e) => handleTapZone(e, 'left')} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer' }} />
          <div onClick={(e) => handleTapZone(e, 'right')} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  )
}
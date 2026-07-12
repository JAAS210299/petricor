'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2, MapPin, BarChart3, Timer } from 'lucide-react'
import type { Sticker } from '@/lib/stickers'

interface Story {
  id: string
  media_url: string
  media_type: string
  created_at: string
  stickers?: Sticker[]
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

function CountdownDisplay({ targetDate, label }: { targetDate: string; label: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setRemaining('¡Ya llegó!'); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setRemaining(days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '16px', padding: '10px 16px', textAlign: 'center', color: 'white' }}>
      <p style={{ fontSize: '11px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <Timer size={11} /> {label}
      </p>
      <p style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{remaining}</p>
    </div>
  )
}

function PollDisplay({ storyId, sticker, currentUserId }: { storyId: string; sticker: Extract<Sticker, { type: 'poll' }>; currentUserId: string }) {
  const [counts, setCounts] = useState<[number, number]>([0, 0])
  const [myVote, setMyVote] = useState<number | null>(null)
  const supabase = createClient()

  const loadVotes = useCallback(async () => {
    const { data } = await supabase
      .from('story_poll_votes')
      .select('option_index, voter_id')
      .eq('story_id', storyId)
      .eq('sticker_id', sticker.id)

    if (!data) return
    const a = data.filter(v => v.option_index === 0).length
    const b = data.filter(v => v.option_index === 1).length
    setCounts([a, b])
    const mine = data.find(v => v.voter_id === currentUserId)
    setMyVote(mine ? mine.option_index : null)
  }, [storyId, sticker.id, currentUserId, supabase])

  useEffect(() => {
    loadVotes()
  }, [loadVotes])

  async function vote(optionIndex: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (myVote !== null) return
    setMyVote(optionIndex)
    setCounts(prev => {
      const next: [number, number] = [...prev]
      next[optionIndex] += 1
      return next
    })
    await supabase.from('story_poll_votes').insert({
      story_id: storyId,
      sticker_id: sticker.id,
      voter_id: currentUserId,
      option_index: optionIndex,
    })
  }

  const total = counts[0] + counts[1]
  const pctA = total > 0 ? Math.round((counts[0] / total) * 100) : 0
  const pctB = total > 0 ? Math.round((counts[1] / total) * 100) : 0

  return (
    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '12px', width: '220px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <BarChart3 size={13} /> {sticker.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[sticker.optionA, sticker.optionB].map((opt, i) => (
          <button
            key={i}
            onClick={(e) => vote(i, e)}
            disabled={myVote !== null}
            style={{
              position: 'relative', padding: '8px', borderRadius: '10px',
              border: myVote === i ? '1.5px solid #60a5fa' : '1.5px solid #111',
              textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#111',
              overflow: 'hidden', cursor: myVote === null ? 'pointer' : 'default',
              background: 'transparent',
            }}
          >
            {myVote !== null && (
              <div style={{
                position: 'absolute', inset: 0, left: 0,
                width: `${i === 0 ? pctA : pctB}%`,
                background: '#dbeafe', zIndex: 0, transition: 'width 0.3s',
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {opt} {myVote !== null && `· ${i === 0 ? pctA : pctB}%`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StickerOverlay({ sticker, storyId, currentUserId }: { sticker: Sticker; storyId: string; currentUserId: string }) {
  let content: React.ReactNode = null

  if (sticker.type === 'mention') {
    content = (
      <Link href={`/perfil/${sticker.username}`} onClick={(e) => e.stopPropagation()}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '20px', color: 'white', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
        @{sticker.username}
      </Link>
    )
  } else if (sticker.type === 'location') {
    content = (
      <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '20px', color: 'white', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={14} /> {sticker.text}
      </div>
    )
  } else if (sticker.type === 'poll') {
    content = <PollDisplay storyId={storyId} sticker={sticker} currentUserId={currentUserId} />
  } else if (sticker.type === 'countdown') {
    content = <CountdownDisplay targetDate={sticker.targetDate} label={sticker.label} />
  }

  if (!content) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {content}
    </div>
  )
}

export default function StoryViewer({ groups, startGroupIndex, currentUserId, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
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

  useEffect(() => {
    if (!story) return
    supabase.from('story_views').insert({ story_id: story.id, viewer_id: currentUserId }).then(() => {})
  }, [story?.id, currentUserId, supabase])

  useEffect(() => {
    if (!story || paused) return
    setProgress(0)
    startTimeRef.current = Date.now()

    if (story.media_type === 'video') return

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
        position: 'relative', width: '100%', maxWidth: '420px', height: '100%', maxHeight: '100vh',
        background: 'black', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', gap: '4px', padding: '10px 10px 0', zIndex: 2 }}>
          {group.stories.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: '2.5px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'white',
                width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                transition: i === storyIndex ? 'none' : 'width 0.2s',
              }} />
            </div>
          ))}
        </div>

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

          {/* Stickers interactivos */}
          {(story.stickers ?? []).map(s => (
            <StickerOverlay key={s.id} sticker={s} storyId={story.id} currentUserId={currentUserId} />
          ))}

          <div onClick={(e) => handleTapZone(e, 'left')} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer' }} />
          <div onClick={(e) => handleTapZone(e, 'right')} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  )
}
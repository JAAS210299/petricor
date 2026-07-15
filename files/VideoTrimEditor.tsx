'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Scissors } from 'lucide-react'
import { trimVideoBlob } from '@/lib/videoTrim'

interface Props {
  file: File
  maxDuration?: number
  onConfirm: (trimmedFile: File) => void
  onCancel: () => void
}

export default function VideoTrimEditor({ file, maxDuration = 15, onConfirm, onCancel }: Props) {
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playhead, setPlayhead] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const draggingHandle = useRef<'start' | 'end' | null>(null)
  const rafRef = useRef<number | null>(null)

  const videoUrl = useRef<string>(URL.createObjectURL(file))

  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl.current)
  }, [])

  function handleLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    const dur = v.duration
    setDuration(dur)
    setStart(0)
    setEnd(Math.min(dur, maxDuration))
  }

  // Reproduce en bucle el tramo seleccionado como vista previa
  useEffect(() => {
    const v = videoRef.current
    if (!v || duration === 0) return
    v.currentTime = start
    v.play().catch(() => {})

    function loop() {
      if (!v) return
      if (v.currentTime >= end) {
        v.currentTime = start
      }
      setPlayhead(v.currentTime)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [start, end, duration])

  function pctToTime(pct: number) {
    return (pct / 100) * duration
  }

  function timeToPct(t: number) {
    return duration > 0 ? (t / duration) * 100 : 0
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingHandle.current || !barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const t = pctToTime(pct)

    if (draggingHandle.current === 'start') {
      const clamped = Math.max(0, Math.min(t, end - 0.3))
      // No permitir un tramo mayor a maxDuration
      setStart(Math.max(clamped, end - maxDuration))
    } else {
      const clamped = Math.min(duration, Math.max(t, start + 0.3))
      setEnd(Math.min(clamped, start + maxDuration))
    }
  }, [duration, start, end, maxDuration])

  function handlePointerUp() {
    draggingHandle.current = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }

  function startDrag(handle: 'start' | 'end') {
    draggingHandle.current = handle
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function formatTime(t: number) {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const trimmedBlob = await trimVideoBlob(file, start, end)
      const trimmedFile = new File([trimmedBlob], `recorte-${Date.now()}.webm`, { type: 'video/webm' })
      onConfirm(trimmedFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recortar el video')
    }
    setLoading(false)
  }

  const selectedDuration = end - start

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 260, background: 'black', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} style={{ color: 'white' }}>
          <X size={22} />
        </button>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Recortar video</span>
        <div style={{ width: '22px' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          src={videoUrl.current}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>

      <div style={{ padding: '16px 20px 28px' }}>
        <p style={{ color: 'white', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
          {formatTime(selectedDuration)} seleccionados · máximo {maxDuration}s
        </p>

        {/* Timeline con manecillas */}
        <div
          ref={barRef}
          style={{
            position: 'relative', height: '48px', background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px', touchAction: 'none',
          }}
        >
          {/* Zona seleccionada */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${timeToPct(start)}%`, right: `${100 - timeToPct(end)}%`,
            background: 'rgba(96,165,250,0.35)', border: '2px solid #60a5fa', borderRadius: '6px',
          }} />

          {/* Playhead */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: '2px',
            left: `${timeToPct(playhead)}%`, background: 'white',
          }} />

          {/* Manecilla inicio */}
          <div
            onPointerDown={() => startDrag('start')}
            style={{
              position: 'absolute', top: 0, bottom: 0, left: `${timeToPct(start)}%`,
              width: '18px', marginLeft: '-9px',
              background: '#60a5fa', borderRadius: '6px',
              cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: '3px', height: '18px', background: 'white', borderRadius: '2px' }} />
          </div>

          {/* Manecilla fin */}
          <div
            onPointerDown={() => startDrag('end')}
            style={{
              position: 'absolute', top: 0, bottom: 0, left: `${timeToPct(end)}%`,
              width: '18px', marginLeft: '-9px',
              background: '#60a5fa', borderRadius: '6px',
              cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: '3px', height: '18px', background: 'white', borderRadius: '2px' }} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{formatTime(start)}</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{formatTime(end)}</span>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || duration === 0}
          className="w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl mt-4 disabled:opacity-50"
          style={{ background: 'white', color: 'black', fontWeight: 600 }}
        >
          <Scissors size={15} />
          {loading ? 'recortando...' : 'confirmar recorte'}
        </button>
      </div>
    </div>
  )
}

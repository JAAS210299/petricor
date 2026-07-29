'use client'

import { useState, useRef } from 'react'
import { X, Gauge } from 'lucide-react'
import { changeVideoSpeed } from '@/lib/videoSpeed'

interface Props {
  file: File
  onConfirm: (newFile: File) => void
  onCancel: () => void
}

const SPEEDS = [
  { value: 0.3, label: '0.3x', desc: 'súper lento' },
  { value: 0.5, label: '0.5x', desc: 'lento' },
  { value: 1, label: '1x', desc: 'normal' },
  { value: 1.5, label: '1.5x', desc: 'rápido' },
  { value: 2, label: '2x', desc: 'muy rápido' },
  { value: 3, label: '3x', desc: 'ultra rápido' },
]

export default function VideoSpeedEditor({ file, onConfirm, onCancel }: Props) {
  const [selectedRate, setSelectedRate] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = useRef<string>(URL.createObjectURL(file))

  function previewRate(rate: number) {
    setSelectedRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      videoRef.current.play().catch(() => {})
    }
  }

  async function handleConfirm() {
    if (selectedRate === 1) {
      // Sin cambios, usar el archivo tal cual
      onConfirm(file)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resultBlob = await changeVideoSpeed(file, selectedRate)
      const resultFile = new File([resultBlob], `velocidad-${Date.now()}.webm`, { type: 'video/webm' })
      onConfirm(resultFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la velocidad')
    }
    setLoading(false)
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', inset: 0, zIndex: 270, background: 'black', display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} style={{ color: 'white' }}>
          <X size={22} />
        </button>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Velocidad</span>
        <div style={{ width: '22px' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          src={videoUrl.current}
          autoPlay
          loop
          playsInline
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>

      <div style={{ padding: '16px 20px 28px' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gauge size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <p style={{ color: 'white', fontSize: '13px' }}>
            {SPEEDS.find(s => s.value === selectedRate)?.desc}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1.5 mb-4">
          {SPEEDS.map(s => (
            <button
              key={s.value}
              onClick={() => previewRate(s.value)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px',
                background: selectedRate === s.value ? '#60a5fa' : 'rgba(255,255,255,0.12)',
                color: 'white', fontSize: '12px', fontWeight: 700,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl disabled:opacity-50"
          style={{ background: 'white', color: 'black', fontWeight: 600 }}
        >
          {loading ? 'procesando...' : 'aplicar velocidad'}
        </button>
      </div>
    </div>
  )
}
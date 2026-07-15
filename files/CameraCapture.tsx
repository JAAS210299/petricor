'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Circle, RotateCcw, Zap } from 'lucide-react'
import { createBoomerangBlob } from '@/lib/boomerang'

interface Props {
  onCapture: (file: File) => void
  onClose: () => void
}

type Mode = 'photo' | 'video' | 'boomerang'
const BOOMERANG_DURATION_MS = 1200
const MAX_VIDEO_DURATION_MS = 15000

export default function CameraCapture({ onCapture, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('photo')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [facingMode])

  async function startCamera() {
    setError(null)
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode !== 'photo',
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('No se pudo acceder a la cámara. Comprueba los permisos del navegador.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function toggleFacing() {
    setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Espejar si es cámara frontal, para que coincida con lo que ves en pantalla
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  function startRecording(auto: boolean) {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = handleRecordingStop
    recorderRef.current = recorder
    recorder.start()
    setRecording(true)

    const maxDuration = auto ? BOOMERANG_DURATION_MS : MAX_VIDEO_DURATION_MS
    recordTimeoutRef.current = setTimeout(() => stopRecording(), maxDuration)
  }

  function stopRecording() {
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current)
    recorderRef.current?.stop()
    setRecording(false)
  }

  async function handleRecordingStop() {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })

    if (mode === 'boomerang') {
      setProcessing(true)
      try {
        const boomerangBlob = await createBoomerangBlob(blob, { fps: 12, cycles: 2 })
        const file = new File([boomerangBlob], `boomerang-${Date.now()}.webm`, { type: 'video/webm' })
        onCapture(file)
      } catch {
        setError('No se pudo crear el boomerang. Intenta grabar un clip más corto.')
      }
      setProcessing(false)
    } else {
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
      onCapture(file)
    }
  }

  function handleCaptureButton() {
    if (mode === 'photo') {
      capturePhoto()
    } else if (mode === 'boomerang') {
      if (!recording) startRecording(true)
    } else {
      if (recording) stopRecording()
      else startRecording(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'black', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3" style={{ zIndex: 2 }}>
        <button onClick={onClose} style={{ color: 'white' }}>
          <X size={22} />
        </button>
        <button onClick={toggleFacing} style={{ color: 'white' }}>
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Vista previa */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {error ? (
          <p style={{ color: 'white', fontSize: '13px', textAlign: 'center', padding: '0 30px' }}>{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        )}

        {processing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
            <Zap size={28} color="#60a5fa" />
            <p style={{ color: 'white', fontSize: '13px' }}>procesando boomerang...</p>
          </div>
        )}

        {recording && (
          <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
            grabando
          </div>
        )}
      </div>

      {/* Selector de modo */}
      <div className="flex items-center justify-center gap-6 py-3" style={{ zIndex: 2 }}>
        {(['photo', 'video', 'boomerang'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => !recording && setMode(m)}
            style={{
              color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
              fontSize: '13px', fontWeight: mode === m ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            {m === 'photo' ? 'foto' : m === 'video' ? 'video' : 'boomerang'}
          </button>
        ))}
      </div>

      {/* Botón de captura */}
      <div className="flex items-center justify-center pb-8">
        <button
          onClick={handleCaptureButton}
          disabled={processing || !!error}
          style={{
            width: '70px', height: '70px', borderRadius: '50%',
            border: '4px solid white', background: recording ? '#ef4444' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {mode !== 'photo' && (
            <Circle size={recording ? 24 : 50} fill={recording ? 'white' : '#ef4444'} color={recording ? 'white' : '#ef4444'} />
          )}
        </button>
      </div>
    </div>
  )
}

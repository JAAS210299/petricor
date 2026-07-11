'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ZoomIn } from 'lucide-react'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

// Dimensiones del marco de edición (proporción 9:16, igual que las historias)
const FRAME_W = 288
const FRAME_H = 512
// Resolución final de salida al publicar
const OUTPUT_W = 1080
const OUTPUT_H = 1920

export default function NuevaHistoria({ userId, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // --- Estado del editor de encuadre (solo para imágenes) ---
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const draggingRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const isImage = file?.type.includes('image')
  const isVideo = file?.type.includes('video')

  function getDisplayedSize(z: number) {
    if (!naturalSize) return { w: FRAME_W, h: FRAME_H, baseScale: 1 }
    const baseScale = Math.max(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h)
    const scale = baseScale * z
    return { w: naturalSize.w * scale, h: naturalSize.h * scale, baseScale }
  }

  function clampOffset(x: number, y: number, z: number) {
    const { w, h } = getDisplayedSize(z)
    const minX = Math.min(0, FRAME_W - w)
    const minY = Math.min(0, FRAME_H - h)
    return {
      x: Math.max(minX, Math.min(0, x)),
      y: Math.max(minY, Math.min(0, y)),
    }
  }

  function handleImageLoad() {
    const img = imgRef.current
    if (!img) return
    const w = img.naturalWidth
    const h = img.naturalHeight
    setNaturalSize({ w, h })
    const baseScale = Math.max(FRAME_W / w, FRAME_H / h)
    const dw = w * baseScale
    const dh = h * baseScale
    setOffset({ x: (FRAME_W - dw) / 2, y: (FRAME_H - dh) / 2 })
    setZoom(1)
  }

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    const dx = e.clientX - draggingRef.current.startX
    const dy = e.clientY - draggingRef.current.startY
    const next = clampOffset(draggingRef.current.startOffsetX + dx, draggingRef.current.startOffsetY + dy, zoom)
    setOffset(next)
  }

  function handlePointerUp() {
    draggingRef.current = null
  }

  function handleZoomChange(newZoom: number) {
    setZoom(newZoom)
    setOffset(prev => clampOffset(prev.x, prev.y, newZoom))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setNaturalSize(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  function removeFile() {
    setFile(null)
    setPreview(null)
    setNaturalSize(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Renderiza el recorte final a un canvas y devuelve un Blob listo para subir
  const renderCroppedImage = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = imgRef.current
      if (!img || !naturalSize) return resolve(null)

      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_W
      canvas.height = OUTPUT_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)

      const scaleFactor = OUTPUT_W / FRAME_W
      const { w: dw, h: dh } = getDisplayedSize(zoom)

      ctx.drawImage(
        img,
        offset.x * scaleFactor,
        offset.y * scaleFactor,
        dw * scaleFactor,
        dh * scaleFactor
      )

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
    })
  }, [naturalSize, offset, zoom])

  async function handlePublish() {
    if (!file) return
    setLoading(true)

    try {
      let uploadBlob: Blob = file
      let ext = file.name.split('.').pop() ?? 'jpg'
      let contentType = file.type

      if (isImage) {
        const cropped = await renderCroppedImage()
        if (cropped) {
          uploadBlob = cropped
          ext = 'jpg'
          contentType = 'image/jpeg'
        }
      }

      const mediaType = isVideo ? 'video' : 'image'
      const path = `${userId}/stories/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, uploadBlob, { contentType, upsert: false })

      if (uploadError) {
        alert('Error al subir: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data } = supabase.storage.from('posts').getPublicUrl(path)

      const { error: insertError } = await supabase.from('stories').insert({
        user_id: userId,
        media_url: data.publicUrl,
        media_type: mediaType,
      })

      setLoading(false)

      if (insertError) {
        alert('Error al publicar: ' + insertError.message)
        return
      }

      onSuccess()
    } catch (err) {
      setLoading(false)
      alert('Error al procesar la imagen')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nueva historia</h2>
          <button onClick={onClose} style={{ color: 'var(--text-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        {!preview && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-xl text-sm transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
          >
            Toca para elegir foto o video
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />

        {/* Editor de encuadre — solo para imágenes */}
        {preview && isImage && (
          <div className="mb-4">
            <div
              style={{
                width: `${FRAME_W}px`, height: `${FRAME_H}px`,
                margin: '0 auto', position: 'relative', overflow: 'hidden',
                borderRadius: '12px', background: 'black', touchAction: 'none', cursor: 'grab',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img
                ref={imgRef}
                src={preview}
                alt="preview"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${offset.x}px`,
                  top: `${offset.y}px`,
                  width: naturalSize ? `${getDisplayedSize(zoom).w}px` : 'auto',
                  height: naturalSize ? `${getDisplayedSize(zoom).h}px` : 'auto',
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Control de zoom */}
            <div className="flex items-center gap-2 mt-3 px-1">
              <ZoomIn size={14} style={{ color: 'var(--text-subtle)' }} />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-xs text-center mt-1" style={{ color: 'var(--text-subtle)' }}>
              arrastra para mover · desliza para hacer zoom
            </p>
          </div>
        )}

        {/* Preview simple para video (sin editor de encuadre) */}
        {preview && isVideo && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', maxHeight: '400px' }}>
            <video src={preview} controls style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: 'black' }} />
          </div>
        )}

        {preview && (
          <div className="flex gap-2">
            <button
              onClick={removeFile}
              className="flex-1 text-sm py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
            >
              cambiar
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 text-sm py-2 rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              {loading ? 'publicando...' : 'publicar historia'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
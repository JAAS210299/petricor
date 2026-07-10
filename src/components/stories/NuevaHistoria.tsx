'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function NuevaHistoria({ userId, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handlePublish() {
    if (!file) return
    setLoading(true)

    const mediaType = file.type.includes('video') ? 'video' : 'image'
    const ext = file.name.split('.').pop()
    const path = `${userId}/stories/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(path, file, { contentType: file.type, upsert: false })

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
          borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '380px',
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

        {preview && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', maxHeight: '400px' }}>
            {file?.type.includes('video') ? (
              <video src={preview} controls style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: 'black' }} />
            ) : (
              <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: 'black' }} />
            )}
          </div>
        )}

        {preview && (
          <div className="flex gap-2">
            <button
              onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
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
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Props {
  postId: string
  userId: string
}

export default function ComentarForm({ postId, userId }: Props) {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMedia(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeMedia() {
    setMedia(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecording(true)
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setMedia(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }))
        setPreview('recording-complete')
      }

      mediaRecorder.start()
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error:', error)
      alert('No se pudo acceder al micrófono')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  async function handleComment() {
    if (!content.trim() && !media) return
    setLoading(true)

    try {
      let media_url = null
      let media_type = null

      if (media) {
        const ext = media.type.includes('audio') ? 'webm' : media.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, media, { contentType: media.type, upsert: false })

        if (uploadError) {
          alert('Error: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('posts').getPublicUrl(path)
        media_url = data.publicUrl

        if (media.type.includes('audio')) media_type = 'audio'
        else if (media.type.includes('video')) media_type = 'video'
        else if (media.type.includes('image')) media_type = 'image'
      }

      await supabase.from('comments').insert({
        post_id: postId,
        user_id: userId,
        content: content.trim() || '',
        media_url,
        media_type,
      })

      setContent('')
      setMedia(null)
      setPreview(null)
      setRecordingTime(0)
      location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al comentar')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div style={{ 
      paddingTop: '20px', 
      borderTop: '1px solid var(--border)',
      maxWidth: '100%'
    }}>
      
      {preview && preview !== 'recording-complete' && (
        <div style={{ marginBottom: '16px', position: 'relative', display: 'inline-block' }}>
          {media?.type.includes('video') ? (
            <video src={preview} style={{ height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            <img src={preview} alt="preview" style={{ height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
          )}
          <button
            onClick={removeMedia}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {preview === 'recording-complete' && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 8px 0' }}>✓ Nota de voz lista</p>
          <button
            onClick={removeMedia}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cambiar audio
          </button>
        </div>
      )}

      {recording && (
        <div style={{
          marginBottom: '16px',
          padding: '14px',
          background: '#ef4444',
          color: 'white',
          borderRadius: '10px',
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🔴 Grabando: {formatTime(recordingTime)}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <textarea
          placeholder="Escribe tu comentario..."
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={recording}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            resize: 'none',
            minHeight: '50px',
            maxHeight: '100px',
            boxSizing: 'border-box',
            opacity: recording ? 0.6 : 1
          }}
          rows={2}
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px',
        marginBottom: '8px'
      }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={recording || !!media}
          style={{
            padding: '14px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: recording || media ? 'not-allowed' : 'pointer',
            opacity: recording || media ? 0.4 : 1,
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!recording && !media) {
              (e.target as HTMLButtonElement).style.background = '#2563eb'
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#3b82f6'
          }}
        >
          📷 IMAGEN
        </button>

        {recording ? (
          <button
            onClick={stopRecording}
            style={{
              padding: '14px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = '#dc2626'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = '#ef4444'
            }}
          >
            ⏹ DETENER
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={!!media}
            style={{
              padding: '14px 12px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: media ? 'not-allowed' : 'pointer',
              opacity: media ? 0.4 : 1,
              fontSize: '13px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!media) {
                (e.target as HTMLButtonElement).style.background = '#be185d'
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = '#ec4899'
            }}
          >
            🎤 AUDIO
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMedia}
          style={{ display: 'none' }}
        />

        <button
          onClick={handleComment}
          disabled={loading || (!content.trim() && !media) || recording}
          style={{
            padding: '14px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || (!content.trim() && !media) || recording ? 'not-allowed' : 'pointer',
            opacity: loading || (!content.trim() && !media) || recording ? 0.4 : 1,
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            gridColumn: 'span 2'
          }}
          onMouseEnter={(e) => {
            if (!loading && (content.trim() || media) && !recording) {
              (e.target as HTMLButtonElement).style.background = '#059669'
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#10b981'
          }}
        >
          {loading ? '⏳ ENVIANDO...' : '✓ ENVIAR COMENTARIO'}
        </button>
      </div>
    </div>
  )
}